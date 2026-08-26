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
const MAX_EAT_EFFECTS = 60
const BIRTH_LIFETIME = 0.7
const DEATH_LIFETIME = 1.1
const EAT_LIFETIME = 0.38
const TAU = Math.PI * 2

export class EffectSystem {
  private readonly effects: Effect[] = []

  handleEvent(event: SimEvent): void {
    if (event.type === 'eat' && this.countKind('eat') >= MAX_EAT_EFFECTS) {
      return
    }
    if (this.effects.length >= MAX_EFFECTS) {
      this.effects.shift()
    }
    this.effects.push({
      x: event.x,
      y: event.y,
      hue: paletteHue(event.hue, event.diet),
      size: event.size,
      age: 0,
      maxAge:
        event.type === 'birth'
          ? BIRTH_LIFETIME
          : event.type === 'eat'
            ? EAT_LIFETIME
            : DEATH_LIFETIME,
      kind: event.type,
    })
  }

  private countKind(kind: SimEvent['type']): number {
    let n = 0
    for (let i = 0; i < this.effects.length; i++) {
      if (this.effects[i].kind === kind) n++
    }
    return n
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
        this.drawBirth(ctx, e, t)
      } else if (e.kind === 'eat') {
        this.drawEatFlash(ctx, e, t)
      } else {
        this.drawDeath(ctx, e, t)
      }
    }
  }

  private drawBirth(ctx: CanvasRenderingContext2D, e: Effect, t: number): void {
    const baseRadius = 3 + e.size * 3

    ctx.strokeStyle = `hsla(${e.hue}, 100%, 82%, ${(1 - t) * 0.8})`
    ctx.lineWidth = 1.6 * (1 - t) + 0.4
    ctx.beginPath()
    ctx.arc(e.x, e.y, baseRadius * (1 + t * 3), 0, TAU)
    ctx.stroke()

    const innerT = Math.min(1, t * 1.8)
    ctx.strokeStyle = `hsla(${e.hue}, 100%, 90%, ${(1 - innerT) * 0.6})`
    ctx.lineWidth = 1.1
    ctx.beginPath()
    ctx.arc(e.x, e.y, baseRadius * (1 + innerT * 1.4), 0, TAU)
    ctx.stroke()

    ctx.fillStyle = `hsla(${e.hue}, 95%, ${88 - t * 20}%, ${(1 - t) * 0.55})`
    ctx.beginPath()
    ctx.arc(e.x, e.y, baseRadius * 0.7 * (1 + t * 0.6), 0, TAU)
    ctx.fill()
  }

  private drawEatFlash(ctx: CanvasRenderingContext2D, e: Effect, t: number): void {
    const fade = 1 - t
    ctx.strokeStyle = `hsla(${e.hue}, 100%, 86%, ${fade * 0.5})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(e.x, e.y, 3.2 + t * 5.5, 0, TAU)
    ctx.stroke()

    ctx.fillStyle = `hsla(${e.hue}, 90%, 88%, ${fade * 0.4})`
    ctx.beginPath()
    ctx.arc(e.x, e.y, Math.max(1.6 * fade, 0.3), 0, TAU)
    ctx.fill()
  }

  private drawDeath(ctx: CanvasRenderingContext2D, e: Effect, t: number): void {
    const baseRadius = 3 + e.size * 3.5
    const fade = 1 - t
    const desat = 1 - t * 0.85

    ctx.fillStyle = `hsla(${e.hue}, ${90 * desat}%, 62%, ${fade * 0.45})`
    ctx.beginPath()
    ctx.arc(e.x, e.y, baseRadius * (1 - t * 0.65), 0, TAU)
    ctx.fill()

    ctx.strokeStyle = `hsla(${e.hue}, ${85 * desat}%, 70%, ${fade * 0.5})`
    ctx.lineWidth = 1.1
    ctx.beginPath()
    ctx.arc(e.x, e.y, baseRadius * (1 + t * 1.6), 0, TAU)
    ctx.stroke()

    const specks = 5
    for (let s = 0; s < specks; s++) {
      const angle = (s / specks) * TAU + e.size
      const dist = baseRadius * (0.35 + t * 1.7)
      const sx = e.x + Math.cos(angle) * dist
      const sy = e.y + Math.sin(angle) * dist
      ctx.fillStyle = `hsla(${e.hue}, ${70 * desat}%, 75%, ${fade * 0.55})`
      ctx.beginPath()
      ctx.arc(sx, sy, Math.max(1.3 * fade, 0.25), 0, TAU)
      ctx.fill()
    }
  }
}
