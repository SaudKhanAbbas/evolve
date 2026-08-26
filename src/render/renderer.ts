import { config } from '../core/config'
import { creatureRadius } from '../sim/creature'
import type { Creature } from '../sim/creature'
import type { Food } from '../sim/food'
import type { Simulation } from '../sim/simulation'

const GLOW_LIMIT = 400

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D
  private readonly canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('EVOLVE: 2D rendering context unavailable')
    }
    this.ctx = ctx
    this.resize()
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = Math.floor(window.innerWidth * dpr)
    this.canvas.height = Math.floor(window.innerHeight * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.paintBackdrop(window.innerWidth, window.innerHeight)
  }

  draw(sim: Simulation): void {
    const w = window.innerWidth
    const h = window.innerHeight

    this.ctx.fillStyle = 'rgba(2, 6, 14, 0.3)'
    this.ctx.fillRect(0, 0, w, h)

    const world = sim.world
    const scale = Math.min(w / world.width, h / world.height)
    const offsetX = (w - world.width * scale) / 2
    const offsetY = (h - world.height * scale) / 2

    this.ctx.save()
    this.ctx.translate(offsetX, offsetY)
    this.ctx.scale(scale, scale)

    for (const food of world.food) {
      this.drawFood(food)
    }
    const glow = world.creatures.length <= GLOW_LIMIT
    for (const creature of world.creatures) {
      this.drawCreature(creature, glow)
    }

    this.ctx.restore()
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

  private drawCreature(creature: Creature, glow: boolean): void {
    const g = creature.genome
    const radius = creatureRadius(g.size)
    const hue = g.hue

    if (glow) {
      this.ctx.shadowBlur = 14
      this.ctx.shadowColor = `hsla(${hue}, 100%, 65%, 0.9)`
    }

    this.ctx.fillStyle = `hsla(${hue}, 85%, 62%, 0.92)`
    this.ctx.beginPath()
    this.ctx.arc(creature.x, creature.y, radius, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.shadowBlur = 0

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    this.ctx.beginPath()
    this.ctx.arc(
      creature.x + Math.cos(creature.heading) * radius * 0.45,
      creature.y + Math.sin(creature.heading) * radius * 0.45,
      radius * 0.28,
      0,
      Math.PI * 2,
    )
    this.ctx.fill()

    if (radius >= 6 && glow) {
      this.ctx.strokeStyle = `hsla(${hue}, 100%, 80%, 0.35)`
      this.ctx.lineWidth = 1.2
      this.ctx.beginPath()
      this.ctx.arc(creature.x, creature.y, radius + 2.5, 0, Math.PI * 2)
      this.ctx.stroke()
    }
  }
}
