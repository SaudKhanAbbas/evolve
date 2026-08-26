import { Camera } from './camera'

const EASE_RATE = 14

export class CameraRig {
  readonly actual: Camera
  private readonly target: Camera

  constructor() {
    this.actual = new Camera()
    this.target = new Camera()
  }

  panBy(dxWorld: number, dyWorld: number, vw: number, vh: number): void {
    this.target.panBy(dxWorld, dyWorld, vw, vh)
  }

  zoomAt(sx: number, sy: number, factor: number, vw: number, vh: number): void {
    this.target.zoomAt(sx, sy, factor, vw, vh)
  }

  screenToWorld(sx: number, sy: number, vw: number, vh: number): { x: number; y: number } {
    return this.actual.screenToWorld(sx, sy, vw, vh)
  }

  scale(vw: number, vh: number): number {
    return this.actual.scale(vw, vh)
  }

  update(dt: number, vw: number, vh: number): void {
    if (!Number.isFinite(dt) || dt <= 0) {
      return
    }
    const t = 1 - Math.exp(-dt * EASE_RATE)
    this.actual.zoom += (this.target.zoom - this.actual.zoom) * t
    this.actual.x += (this.target.x - this.actual.x) * t
    this.actual.y += (this.target.y - this.actual.y) * t
    this.actual.clampToWorld(vw, vh)
  }
}
