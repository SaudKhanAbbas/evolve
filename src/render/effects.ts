import type { SimEvent } from '../sim/events'
import { paletteHue } from './palette'

interface Effect {
  x: number
  y: number
  hue: number
  size: number
  age: number
  maxAge: number
  kind: SimEvent['type']
}

const MAX_EFFECTS = 300
const BIRTH_LIFETIME = 0.7
const DEATH_LIFETIME = 1.1
const TAU = Math.PI * 2

export class EffectSystem {
  private readonly effects: Effect[] = []

  handleEvent(event: SimEvent): void {
    if (this.effects.length >= MAX_EFFECTS) {
      this.effects.shift()
    }
    this.effects.push({
      x: event.x,
      y: event.y,
      hue: paletteHue(event.hue, event.diet),
      size: event.size,
      age: 0,
      maxAge: event.type === 'birth' ? BIRTH_LIFETIME : DEATH_LIFETIME,
      kind: event.type,
    })
  }

  update(dt: number): void {
    let write = 0
    for (let i = 0; i < this.effects.length; i++) {
      const effect = this.effects[i]
      effect.age += dt
      if (effect.age < effect.maxAge) {
        this.effects[write++] = effect
      }
    }
    this.effects.length = write
  }

  get count(): number {
    return this.effects.length
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.effects.length; i++) {
      const e = this.effects[i]
      const t = e.age / e.maxAge
      if (e.kind === 'birth') {
        this.drawBirthRing(ctx, e, t)
      } else {
        this.drawDeathPuff(ctx, e, t)
      }
    }
  }

  private drawBirthRing(ctx: CanvasRenderingContext2D, e: Effect, t: number): void {
    const radius = (3 + e.size * 3) * (1 + t * 3.5)
    ctx.strokeStyle = `hsla(${e.hue}, 100%, 78%, ${(1 - t) * 0.85})`
    ctx.lineWidth = 1.6 * (1 - t) + 0.4
    ctx.beginPath()
    ctx.arc(e.x, e.y, radius, 0, TAU)
    ctx.stroke()
  }

  private drawDeathPuff(ctx: CanvasRenderingContext2D, e: Effect, t: number): void {
    const baseRadius = 3 + e.size * 3.5
    const fade = 1 - t

    ctx.strokeStyle = `hsla(${e.hue}, 90%, 70%, ${fade * 0.6})`
    ctx.lineWidth = 1.2
    const ringRadius = baseRadius * (1 + t * 1.8)
    ctx.beginPath()
    ctx.arc(e.x, e.y, ringRadius, 0, TAU)
    ctx.stroke()

    const specks = 5
    for (let s = 0; s < specks; s++) {
      const angle = (s / specks) * TAU + e.size
      const dist = baseRadius * (0.4 + t * 2.2)
      const sx = e.x + Math.cos(angle) * dist
      const sy = e.y + Math.sin(angle) * dist
      ctx.fillStyle = `hsla(${e.hue}, 95%, 75%, ${fade * 0.7})`
      ctx.beginPath()
      ctx.arc(sx, sy, Math.max(1.4 * fade, 0.3), 0, TAU)
      ctx.fill()
    }
  }
}
