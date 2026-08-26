import { config } from '../core/config'
import { creatureRadius } from '../sim/creature'
import type { Creature } from '../sim/creature'
import type { Food } from '../sim/food'
import type { Simulation } from '../sim/simulation'
import type { Camera } from './camera'
import { drawOrganism } from './creatureArtist'
import { paletteHue } from './palette'
import { Environment } from './environment'
import type { EffectSystem } from './effects'
import { clamp, lerp, lerpAngle } from '../utils/math'

interface InterpState {
  x: number
  y: number
  heading: number
  phase: number
  seenTick: number
}

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D
  private readonly canvas: HTMLCanvasElement
  private readonly environment = new Environment()
  private readonly prevById = new Map<number, InterpState>()
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
    this.paintBackdrop(w, h)
  }

  draw(
    sim: Simulation,
    camera: Camera,
    effects?: EffectSystem,
    selectedId?: number | null,
    interpAlpha = 0,
  ): void {
    const { w, h } = this.cssSize()
    if (w === 0 || h === 0) return
    const timeSec = performance.now() / 1000
    const frameDt = Number.isFinite(this.lastFrameTimeSec)
      ? clamp(timeSec - this.lastFrameTimeSec, 0, 0.1)
      : 0
    this.lastFrameTimeSec = timeSec
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

    this.ctx.save()
    camera.applyTransform(this.ctx, w, h)
    const viewScale = camera.scale(w, h)
    this.environment.drawBack(this.ctx, camera, timeSec)
    this.environment.drawOutsideDim(this.ctx)
    this.environment.drawBoundary(this.ctx, viewScale)

    for (const food of sim.world.food) {
      this.drawFood(food, timeSec)
    }
    for (const creature of sim.world.creatures) {
      const prev = this.prevById.get(creature.id)
      let x = creature.x
      let y = creature.y
      let heading = creature.heading
      let phase = creature.id * 1.7
      if (prev) {
        x = lerp(prev.x, creature.x, alpha)
        y = lerp(prev.y, creature.y, alpha)
        heading = lerpAngle(prev.heading, creature.heading, alpha)
        phase = prev.phase
      }
      drawOrganism(this.ctx, creature, timeSec, viewScale, x, y, heading, phase)
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
          }
          this.prevById.set(creature.id, entry)
        } else {
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
    }

    const speedPhaseAdvance = frameDt
    for (const creature of sim.world.creatures) {
      const entry = this.prevById.get(creature.id)
      if (!entry) continue
      const speedNorm = clamp(
        Math.hypot(creature.vx, creature.vy) / (creature.genome.maxSpeed * 45),
        0,
        1,
      )
      entry.phase += speedPhaseAdvance * (3.5 + creature.genome.metabolism * 3 + speedNorm * 4.5)
    }
  }

  private drawSelection(creature: Creature, scale: number, timeSec: number): void {
    const g = creature.genome
    const radius = creatureRadius(g.size)
    const hue = paletteHue(g.hue, g.diet)

    this.ctx.strokeStyle = `hsla(${hue}, 100%, 85%, 0.25)`
    this.ctx.lineWidth = 1 / Math.max(scale, 1e-6)
    this.ctx.beginPath()
    this.ctx.arc(creature.x, creature.y, g.senseRadius, 0, Math.PI * 2)
    this.ctx.stroke()

    this.ctx.strokeStyle = `hsla(${hue}, 90%, 88%, 0.95)`
    this.ctx.lineWidth = 2 / Math.max(scale, 1e-6)
    const spin = (timeSec * 0.8) % (Math.PI * 2)
    for (let arc = 0; arc < 4; arc++) {
      this.ctx.beginPath()
      this.ctx.arc(
        creature.x,
        creature.y,
        radius + 6,
        spin + (arc * Math.PI) / 2 + 0.25,
        spin + (arc * Math.PI) / 2 + Math.PI / 2 - 0.25,
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

    const glow = this.ctx.createRadialGradient(
      w / 2,
      h * 0.85,
      0,
      w / 2,
      h * 0.85,
      Math.max(w, h) * 0.6,
    )
    glow.addColorStop(0, config.palette.glow)
    glow.addColorStop(1, 'transparent')
    this.ctx.fillStyle = glow
    this.ctx.fillRect(0, 0, w, h)
  }

  private drawFood(food: Food, timeSec: number): void {
    const phase = food.id * 0.91
    const pulse = Math.sin(timeSec * 1.6 + phase)
    const radius = 2.2 + pulse * 0.45
    const alpha = 0.58 + pulse * 0.16

    this.ctx.fillStyle = `rgba(94, 234, 212, ${alpha * 0.28})`
    this.ctx.beginPath()
    this.ctx.arc(food.x, food.y, radius * 2.1, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = `rgba(150, 255, 236, ${alpha})`
    this.ctx.beginPath()
    this.ctx.arc(food.x, food.y, radius, 0, Math.PI * 2)
    this.ctx.fill()
  }
}
