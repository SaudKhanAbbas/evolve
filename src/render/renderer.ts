import { config } from '../core/config'
import { WORLD_HEIGHT, WORLD_WIDTH } from '../sim/config'
import { creatureRadius } from '../sim/creature'
import type { Creature } from '../sim/creature'
import type { Food } from '../sim/food'
import type { Simulation } from '../sim/simulation'
import type { Camera } from './camera'
import { drawOrganism } from './creatureArtist'
import { paletteHue } from './palette'
import type { EffectSystem } from './effects'

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D
  private readonly canvas: HTMLCanvasElement
  private lastCamX = Number.NaN
  private lastCamY = Number.NaN
  private lastCamZoom = Number.NaN
  private resizeRetryQueued = false

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

  draw(sim: Simulation, camera: Camera, effects?: EffectSystem, selectedId?: number | null): void {
    const { w, h } = this.cssSize()
    if (w === 0 || h === 0) return
    const timeSec = performance.now() / 1000

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
    this.drawWorldBoundary(viewScale)

    for (const food of sim.world.food) {
      this.drawFood(food)
    }
    for (const creature of sim.world.creatures) {
      drawOrganism(this.ctx, creature, timeSec, viewScale)
    }
    effects?.draw(this.ctx)

    if (selectedId != null) {
      const selected = sim.world.creatures.find((c) => c.id === selectedId)
      if (selected) {
        this.drawSelection(selected, viewScale, timeSec)
      }
    }

    this.ctx.restore()
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

  private drawWorldBoundary(scale: number): void {
    this.ctx.strokeStyle = 'rgba(45, 212, 191, 0.12)'
    this.ctx.lineWidth = 1.5 / Math.max(scale, 1e-6)
    this.ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
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

  private drawFood(food: Food): void {
    this.ctx.fillStyle = 'rgba(94, 234, 212, 0.75)'
    this.ctx.beginPath()
    this.ctx.arc(food.x, food.y, 2.4, 0, Math.PI * 2)
    this.ctx.fill()
  }
}
