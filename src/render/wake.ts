import type { DetailTier } from './detail'

const MAX_POINTS = 8
const SAMPLE_INTERVAL_SEC = 0.09

export interface WakeTrail {
  points: number[]
  head: number
  count: number
  hue: number
  size: number
  strength: number
  lastSample: number
  seenTick: number
}

export function wakeEligible(tier: DetailTier, speedNorm: number, sizeGene: number): boolean {
  if (tier === 'distant') return false
  if (tier === 'low') return speedNorm > 0.75 && sizeGene > 1.8
  return speedNorm > 0.25
}

export function wakeStrength(tier: DetailTier, speedNorm: number): number {
  const base = tier === 'high' ? 0.5 : tier === 'medium' ? 0.34 : 0.18
  return base * (0.4 + 0.6 * speedNorm)
}

export class WakeSystem {
  private readonly trails = new Map<number, WakeTrail>()

  get size(): number {
    return this.trails.size
  }

  trailForTest(id: number): WakeTrail | undefined {
    return this.trails.get(id)
  }

  mark(
    id: number,
    tick: number,
    x: number,
    y: number,
    hue: number,
    size: number,
    nowSec: number,
    strength: number,
  ): void {
    let trail = this.trails.get(id)
    if (!trail) {
      trail = {
        points: new Array(MAX_POINTS * 2).fill(0),
        head: 0,
        count: 0,
        hue,
        size,
        strength,
        lastSample: nowSec,
        seenTick: tick,
      }
      this.trails.set(id, trail)
    }
    trail.seenTick = tick
    trail.hue = hue
    trail.size = size
    trail.strength = strength
    if (nowSec - trail.lastSample < SAMPLE_INTERVAL_SEC) return
    trail.lastSample = nowSec
    trail.points[trail.head * 2] = x
    trail.points[trail.head * 2 + 1] = y
    trail.head = (trail.head + 1) % MAX_POINTS
    if (trail.count < MAX_POINTS) trail.count++
  }

  endTick(tick: number): void {
    for (const [id, trail] of this.trails) {
      if (trail.seenTick !== tick) {
        this.trails.delete(id)
      }
    }
  }

  clear(): void {
    this.trails.clear()
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.lineCap = 'round'
    for (const trail of this.trails.values()) {
      if (trail.count < 2) continue
      ctx.strokeStyle = `hsla(${trail.hue}, 90%, 70%, 1)`
      for (let i = 1; i < trail.count; i++) {
        const t = i / (trail.count - 1)
        const alpha = t * t * trail.strength
        ctx.globalAlpha = alpha
        ctx.lineWidth = Math.max(trail.size * 1.1 * t, 0.4)
        ctx.beginPath()
        const from = indexAt(trail, i - 1)
        const to = indexAt(trail, i)
        ctx.moveTo(trail.points[from * 2], trail.points[from * 2 + 1])
        ctx.lineTo(trail.points[to * 2], trail.points[to * 2 + 1])
        ctx.stroke()
      }
    }
    ctx.globalAlpha = 1
    ctx.restore()
  }
}

function indexAt(trail: WakeTrail, index: number): number {
  const oldest = (trail.head - trail.count + MAX_POINTS) % MAX_POINTS
  return (oldest + index) % MAX_POINTS
}
