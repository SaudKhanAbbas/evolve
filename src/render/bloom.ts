import { clamp } from '../utils/math'

const HUE_BUCKETS = 24
const SPRITE_SIZE = 128

const sprites: HTMLCanvasElement[] = []
let initialized = false

export function bloomBucket(hue: number): number {
  const norm = ((hue % 360) + 360) % 360
  return Math.min(HUE_BUCKETS - 1, Math.floor((norm / 360) * HUE_BUCKETS))
}

function buildSprites(): void {
  for (let i = 0; i < HUE_BUCKETS; i++) {
    const hue = (360 * i) / (HUE_BUCKETS - 1)
    const canvas = document.createElement('canvas')
    canvas.width = SPRITE_SIZE
    canvas.height = SPRITE_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    const half = SPRITE_SIZE / 2
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half)
    gradient.addColorStop(0, `hsla(${hue}, 100%, 88%, 0.85)`)
    gradient.addColorStop(0.22, `hsla(${hue}, 95%, 66%, 0.42)`)
    gradient.addColorStop(0.55, `hsla(${hue}, 90%, 55%, 0.13)`)
    gradient.addColorStop(1, `hsla(${hue}, 90%, 50%, 0)`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)
    sprites.push(canvas)
  }
  initialized = true
}

export function drawBloom(
  ctx: CanvasRenderingContext2D,
  hue: number,
  x: number,
  y: number,
  radius: number,
  alpha: number,
): void {
  if (!initialized && typeof document !== 'undefined') {
    buildSprites()
  }
  const sprite = sprites[bloomBucket(hue)]
  if (!sprite || radius <= 0 || alpha <= 0) return

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = clamp(alpha, 0, 1)
  ctx.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2)
  ctx.restore()
}
