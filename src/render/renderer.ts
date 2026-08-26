import { config } from '../core/config'
import { SPEED_SCALE } from '../sim/config'
import { creatureRadius } from '../sim/creature'
import type { Creature } from '../sim/creature'
import type { Food } from '../sim/food'
import type { Simulation } from '../sim/simulation'
import type { Camera } from './camera'
import { drawOrganism } from './creatureArtist'
import { paletteHue } from './palette'
import { drawBloom } from './bloom'
import { Environment } from './environment'
import type { EffectSystem } from './effects'
import { QualityController, detailTier } from './detail'
import { WakeSystem, wakeEligible, wakeStrength } from './wake'
import { morphologyFor } from './morphology'
import { TAU, clamp, lerp, lerpAngle } from '../utils/math'

interface InterpState {
  x: number
  y: number
  heading: number
  phase: number
  seenTick: number
  targetLean: number
  lean: number
}

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D
  private readonly canvas: HTMLCanvasElement
  private readonly environment = new Environment()
  private readonly quality = new QualityController()
  private readonly prevById = new Map<number, InterpState>()
  private readonly wakes = new WakeSystem()
  private glowCanvas: HTMLCanvasElement | null = null
  private glowCtx: CanvasRenderingContext2D | null = null
  private lastInterpTick = -1
  private lastCamX = Number.NaN
  private lastCamY = Number.NaN
  private lastCamZoom = Number.NaN
  private resizeRetryQueued = false
  private lastFrameTimeSec = Number.NaN

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('EVOLVE: 2D rendering context unavailable')
    }
    this.ctx = ctx
    this.resize()
  }

  private cssSize(): { w: number; h: number } {
    return { w: this.canvas.clientWidth, h: this.canvas.clientHeight }
  }

  resize(): void {
    const { w, h } = this.cssSize()
    if (w === 0 || h === 0) {
      if (!this.resizeRetryQueued) {
        this.resizeRetryQueued = true
        requestAnimationFrame(() => {
          this.resizeRetryQueued = false
          this.resize()
        })
      }
      return
    }

    const dpr = window.devicePixelRatio || 1
    this.canvas.width = Math.floor(w * dpr)
    this.canvas.height = Math.floor(h * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.lastCamX = Number.NaN
    if (this.glowCanvas) {
      this.glowCanvas.width = this.canvas.width
      this.glowCanvas.height = this.canvas.height
    }
    this.paintBackdrop(w, h)
  }

  draw(
    sim: Simulation,
    camera: Camera,
    effects?: EffectSystem,
    selectedId?: number | null,
    interpAlpha = 0,
    hoverId?: number | null,
    frameMs = 16,
  ): void {
    const { w, h } = this.cssSize()
    if (w === 0 || h === 0) return
    const timeSec = performance.now() / 1000
    const frameDt = Number.isFinite(this.lastFrameTimeSec)
      ? clamp(timeSec - this.lastFrameTimeSec, 0, 0.1)
      : 0
    this.lastFrameTimeSec = timeSec
    this.quality.update(frameMs, frameDt)
    const quality = this.quality.quality
    this.environment.update(frameDt)
    const alpha = clamp(interpAlpha, 0, 1)
    this.refreshInterpolationSnapshot(sim, frameDt)

    if (
      camera.x !== this.lastCamX ||
      camera.y !== this.lastCamY ||
      camera.zoom !== this.lastCamZoom
    ) {
      this.paintBackdrop(w, h)
      this.lastCamX = camera.x
      this.lastCamY = camera.y
      this.lastCamZoom = camera.zoom
    } else {
      this.ctx.fillStyle = 'rgba(2, 6, 14, 0.3)'
      this.ctx.fillRect(0, 0, w, h)
    }

    this.renderGlowLayer(sim, camera, w, h, alpha, hoverId)

    this.ctx.save()
    camera.applyTransform(this.ctx, w, h)
    const viewScale = camera.scale(w, h)
    this.environment.drawBack(this.ctx, camera, timeSec, quality)
    this.environment.drawOutsideDim(this.ctx)
    this.environment.drawBoundary(this.ctx, viewScale)
    this.wakes.draw(this.ctx)

    for (const food of sim.world.food) {
      this.drawFood(food, timeSec, viewScale)
    }

    for (const creature of sim.world.creatures) {
      const prev = this.prevById.get(creature.id)
      let x = creature.x
      let y = creature.y
      let heading = creature.heading
      let phase = creature.id * 1.7
      let lean = 0
      if (prev) {
        x = lerp(prev.x, creature.x, alpha)
        y = lerp(prev.y, creature.y, alpha)
        heading = lerpAngle(prev.heading, creature.heading, alpha)
        phase = prev.phase
        lean = prev.lean
      }
      const tier = detailTier(creature.genome.size * 2.5 * viewScale, quality)
      const speedNorm = clamp(
        Math.hypot(creature.vx, creature.vy) / (creature.genome.maxSpeed * SPEED_SCALE),
        0,
        1,
      )
      if (wakeEligible(tier, speedNorm, creature.genome.size)) {
        this.wakes.mark(
          creature.id,
          this.lastInterpTick,
          x,
          y,
          paletteHue(creature.genome.hue, creature.genome.diet),
          creature.genome.size,
          timeSec,
          wakeStrength(tier, speedNorm),
        )
      }
      drawOrganism(this.ctx, creature, timeSec, tier, x, y, heading, phase, lean)
    }
    effects?.draw(this.ctx)

    if (selectedId != null) {
      const selected = sim.world.creatures.find((c) => c.id === selectedId)
      if (selected) {
        this.drawSelection(selected, viewScale, timeSec)
      }
    }

    this.ctx.restore()

    this.environment.drawVignette(this.ctx, w, h)
  }

  private refreshInterpolationSnapshot(sim: Simulation, frameDt: number): void {
    const tick = sim.world.tick
    if (tick !== this.lastInterpTick) {
      this.lastInterpTick = tick
      for (const creature of sim.world.creatures) {
        let entry = this.prevById.get(creature.id)
        if (!entry) {
          entry = {
            x: creature.x,
            y: creature.y,
            heading: creature.heading,
            phase: creature.id * 1.7,
            seenTick: tick,
            targetLean: 0,
            lean: 0,
          }
          this.prevById.set(creature.id, entry)
        } else {
          let dH = creature.heading - entry.heading
          dH = (((dH % TAU) + TAU * 1.5) % TAU) - TAU / 2
          entry.targetLean = clamp(dH * 0.28, -1, 1)
          entry.x = creature.x
          entry.y = creature.y
          entry.heading = creature.heading
          entry.seenTick = tick
        }
      }
      for (const [id, entry] of this.prevById) {
        if (entry.seenTick !== tick) {
          this.prevById.delete(id)
        }
      }
      this.wakes.endTick(tick)
    }

    const ease = Math.min(1, frameDt * 12)
    const speedPhaseAdvance = frameDt
    for (const creature of sim.world.creatures) {
      const entry = this.prevById.get(creature.id)
      if (!entry) continue
      const speedNorm = clamp(
        Math.hypot(creature.vx, creature.vy) / (creature.genome.maxSpeed * SPEED_SCALE),
        0,
        1,
      )
      entry.phase += speedPhaseAdvance * (3.5 + creature.genome.metabolism * 3 + speedNorm * 4.5)
      entry.lean += (entry.targetLean - entry.lean) * ease
    }
  }

  private renderGlowLayer(
    sim: Simulation,
    camera: Camera,
    w: number,
    h: number,
    alpha: number,
    hoverId: number | null | undefined,
  ): void {
    if (!this.glowCanvas || !this.glowCtx) {
      this.glowCanvas = document.createElement('canvas')
      this.glowCanvas.width = this.canvas.width
      this.glowCanvas.height = this.canvas.height
      this.glowCtx = this.glowCanvas.getContext('2d')
      if (!this.glowCtx) return
    }
    const gctx = this.glowCtx
    const dpr = window.devicePixelRatio || 1
    gctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    gctx.clearRect(0, 0, w, h)

    gctx.save()
    camera.applyTransform(gctx, w, h)

    for (const creature of sim.world.creatures) {
      const morph = morphologyFor(creature.id, creature.genome)
      let x = creature.x
      let y = creature.y
      if (alpha > 0) {
        const prev = this.prevById.get(creature.id)
        if (prev) {
          x = lerp(prev.x, creature.x, alpha)
          y = lerp(prev.y, creature.y, alpha)
        }
      }
      const energyAlpha = 0.5 + 0.45 * clamp(creature.energy / (80 * creature.genome.size), 0, 1)
      drawBloom(
        gctx,
        morph.hue,
        x,
        y,
        Math.max(morph.shape.radiusX, morph.shape.radiusY) * 2.2,
        energyAlpha * 0.9,
      )
    }

    if (hoverId != null && hoverId !== undefined) {
      const hovered = sim.world.creatures.find((c) => c.id === hoverId)
      if (hovered) {
        const g = hovered.genome
        drawBloom(
          gctx,
          paletteHue(g.hue, g.diet),
          hovered.x,
          hovered.y,
          creatureRadius(g.size) * 2.6,
          0.3,
        )
      }
    }

    gctx.restore()

    this.ctx.save()
    this.ctx.globalCompositeOperation = 'lighter'
    this.ctx.drawImage(this.glowCanvas, 0, 0, w, h)
    this.ctx.restore()
  }

  private drawSelection(creature: Creature, scale: number, timeSec: number): void {
    const g = creature.genome
    const radius = creatureRadius(g.size)
    const hue = paletteHue(g.hue, g.diet)

    const senseAlpha = clamp((scale - 0.55) / 1.1, 0, 1) * 0.3
    if (senseAlpha > 0.01) {
      this.ctx.strokeStyle = `hsla(${hue}, 100%, 85%, ${senseAlpha})`
      this.ctx.lineWidth = 1 / Math.max(scale, 1e-6)
      this.ctx.beginPath()
      this.ctx.arc(creature.x, creature.y, g.senseRadius, 0, Math.PI * 2)
      this.ctx.stroke()
    }

    this.ctx.strokeStyle = `hsla(${hue}, 90%, 88%, 0.95)`
    this.ctx.lineWidth = 1.4 / Math.max(scale, 1e-6)
    const spin = (timeSec * 0.5) % (Math.PI * 2)
    for (let arc = 0; arc < 4; arc++) {
      this.ctx.beginPath()
      this.ctx.arc(
        creature.x,
        creature.y,
        radius + 7,
        spin + (arc * Math.PI) / 2 + 0.28,
        spin + (arc * Math.PI) / 2 + Math.PI / 2 - 0.28,
      )
      this.ctx.stroke()
    }
  }

  private paintBackdrop(w: number, h: number): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, h)
    gradient.addColorStop(0, config.palette.abyssTop)
    gradient.addColorStop(1, config.palette.abyssBottom)
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, w, h)
  }

  private drawFood(food: Food, timeSec: number, viewScale: number): void {
    const phase = food.id * 0.91
    const pulse = Math.sin(timeSec * 1.6 + phase)
    const radius = 2.2 + pulse * 0.45
    const alpha = 0.58 + pulse * 0.16

    if (radius * viewScale < 1.4) {
      this.ctx.fillStyle = `rgba(150, 255, 236, ${alpha * 0.85})`
      this.ctx.beginPath()
      this.ctx.arc(food.x, food.y, radius, 0, Math.PI * 2)
      this.ctx.fill()
      return
    }

    this.ctx.fillStyle = `rgba(94, 234, 212, ${alpha * 0.16})`
    this.ctx.beginPath()
    this.ctx.arc(food.x, food.y, radius * 1.9, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = `rgba(150, 255, 236, ${alpha * 0.85})`
    this.ctx.beginPath()
    this.ctx.arc(food.x, food.y, radius, 0, Math.PI * 2)
    this.ctx.fill()
  }
}
