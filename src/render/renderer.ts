import { config } from '../core/config'

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
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = Math.floor(window.innerWidth * dpr)
    this.canvas.height = Math.floor(window.innerHeight * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  draw(): void {
    const w = window.innerWidth
    const h = window.innerHeight

    this.ctx.clearRect(0, 0, w, h)
    this.drawBackdrop(w, h)
  }

  private drawBackdrop(w: number, h: number): void {
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
}
