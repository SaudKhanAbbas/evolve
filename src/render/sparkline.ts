import { Series } from './series'

export class Sparkline {
  readonly series: Series
  private readonly ctx: CanvasRenderingContext2D
  private readonly canvas: HTMLCanvasElement
  private readonly hue: number

  constructor(canvas: HTMLCanvasElement, hue: number, capacity = 240) {
    this.canvas = canvas
    this.hue = hue
    this.series = new Series(capacity)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('EVOLVE: sparkline 2D context unavailable')
    }
    this.ctx = ctx
  }

  push(value: number): void {
    this.series.push(value)
  }

  draw(): void {
    const dpr = window.devicePixelRatio || 1
    const cssW = this.canvas.clientWidth
    const cssH = this.canvas.clientHeight
    if (cssW === 0 || cssH === 0) return

    const targetW = Math.floor(cssW * dpr)
    const targetH = Math.floor(cssH * dpr)
    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW
      this.canvas.height = targetH
    }

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.ctx.clearRect(0, 0, cssW, cssH)

    const values = this.series.values
    if (values.length < 2) {
      this.ctx.strokeStyle = `hsla(${this.hue}, 80%, 60%, 0.25)`
      this.ctx.lineWidth = 1
      this.ctx.beginPath()
      this.ctx.moveTo(0, cssH - 1)
      this.ctx.lineTo(cssW, cssH - 1)
      this.ctx.stroke()
      return
    }

    const range = this.series.paddedRange()
    if (!range) return

    const xAt = (i: number): number => (i / (values.length - 1)) * cssW
    const yAt = (v: number): number =>
      cssH - ((v - range.min) / (range.max - range.min)) * (cssH - 2) - 1

    this.ctx.beginPath()
    this.ctx.moveTo(xAt(0), yAt(values[0]))
    for (let i = 1; i < values.length; i++) {
      this.ctx.lineTo(xAt(i), yAt(values[i]))
    }

    this.ctx.strokeStyle = `hsla(${this.hue}, 85%, 65%, 0.9)`
    this.ctx.lineWidth = 1.4
    this.ctx.stroke()

    this.ctx.lineTo(xAt(values.length - 1), cssH)
    this.ctx.lineTo(xAt(0), cssH)
    this.ctx.closePath()
    this.ctx.fillStyle = `hsla(${this.hue}, 85%, 60%, 0.14)`
    this.ctx.fill()
  }
}
