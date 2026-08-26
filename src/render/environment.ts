import { WORLD_HEIGHT, WORLD_WIDTH } from '../sim/config'
import type { Camera } from './camera'

interface Snowflake {
  x: number
  y: number
  depth: number
  radius: number
  alpha: number
  driftX: number
  driftY: number
  swayPhase: number
  swaySpeed: number
  twinklePhase: number
}

const FLAKE_COUNT = 140
const PAD = 320

function mulberry(seed: number): () => number {
  let state = seed >>> 0
  return (): number => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Environment {
  private readonly flakes: Snowflake[] = []
  private vignetteCanvas: HTMLCanvasElement | null = null
  private vignetteW = 0
  private vignetteH = 0

  constructor() {
    const rand = mulberry(0xc0ffee)
    for (let i = 0; i < FLAKE_COUNT; i++) {
      const deep = rand() < 0.55
      const depth = deep ? 0.35 + rand() * 0.15 : 0.65 + rand() * 0.25
      this.flakes.push({
        x: rand() * (WORLD_WIDTH + PAD * 2) - PAD,
        y: rand() * (WORLD_HEIGHT + PAD * 2) - PAD,
        depth,
        radius: deep ? 0.7 + rand() * 0.8 : 1.0 + rand() * 1.2,
        alpha: deep ? 0.04 + rand() * 0.05 : 0.07 + rand() * 0.07,
        driftX: -(2 + depth * 7),
        driftY: 1.2 + depth * 3.2,
        swayPhase: rand() * Math.PI * 2,
        swaySpeed: 0.2 + rand() * 0.5,
        twinklePhase: rand() * Math.PI * 2,
      })
    }
  }

  get flakeCount(): number {
    return this.flakes.length
  }

  flakeAt(index: number): Readonly<Snowflake> {
    return this.flakes[index]
  }

  update(dt: number): void {
    if (dt <= 0) return
    const minX = -PAD
    const maxX = WORLD_WIDTH + PAD
    const minY = -PAD
    const maxY = WORLD_HEIGHT + PAD
    for (const f of this.flakes) {
      f.x += f.driftX * dt
      f.y += f.driftY * dt
      if (f.x < minX) f.x = maxX
      else if (f.x > maxX) f.x = minX
      if (f.y > maxY) f.y = minY
      else if (f.y < minY) f.y = maxY
    }
  }

  drawBack(ctx: CanvasRenderingContext2D, camera: Camera, timeSec: number): void {
    ctx.fillStyle = 'rgba(190, 235, 228, 1)'
    for (const f of this.flakes) {
      const ex = camera.x + (f.x - camera.x) * f.depth
      const ey =
        camera.y + (f.y - camera.y) * f.depth + Math.sin(timeSec * f.swaySpeed + f.swayPhase) * 7
      const twinkle = 0.72 + 0.28 * Math.sin(timeSec * 1.3 + f.twinklePhase)
      ctx.globalAlpha = f.alpha * twinkle
      ctx.beginPath()
      ctx.arc(ex, ey, f.radius, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  drawOutsideDim(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.beginPath()
    ctx.rect(-8000, -8000, WORLD_WIDTH + 16000, WORLD_HEIGHT + 16000)
    ctx.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    ctx.fillStyle = 'rgba(0, 2, 6, 0.55)'
    ctx.fill('evenodd')
    ctx.restore()
  }

  drawBoundary(ctx: CanvasRenderingContext2D, scale: number): void {
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.07)'
    ctx.lineWidth = 8 / Math.max(scale, 1e-6)
    ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    ctx.strokeStyle = 'rgba(94, 234, 212, 0.22)'
    ctx.lineWidth = 1.2 / Math.max(scale, 1e-6)
    ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
  }

  drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.vignetteCanvas || this.vignetteW !== w || this.vignetteH !== h) {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, w)
      canvas.height = Math.max(1, h)
      const vctx = canvas.getContext('2d')
      if (!vctx) return
      const radius = Math.hypot(w, h) / 2
      const gradient = vctx.createRadialGradient(w / 2, h / 2, radius * 0.45, w / 2, h / 2, radius)
      gradient.addColorStop(0, 'rgba(1, 4, 9, 0)')
      gradient.addColorStop(0.75, 'rgba(1, 4, 9, 0.16)')
      gradient.addColorStop(1, 'rgba(0, 2, 6, 0.46)')
      vctx.fillStyle = gradient
      vctx.fillRect(0, 0, w, h)
      this.vignetteCanvas = canvas
      this.vignetteW = w
      this.vignetteH = h
    }
    ctx.drawImage(this.vignetteCanvas, 0, 0)
  }
}
