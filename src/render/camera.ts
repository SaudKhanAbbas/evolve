import { WORLD_HEIGHT, WORLD_WIDTH } from '../sim/config'
import { clamp } from '../utils/math'

export const MIN_ZOOM = 1
export const MAX_ZOOM = 16

export class Camera {
  x: number
  y: number
  zoom: number

  constructor() {
    this.x = WORLD_WIDTH / 2
    this.y = WORLD_HEIGHT / 2
    this.zoom = 1
  }

  fitScale(viewportWidth: number, viewportHeight: number): number {
    return Math.min(viewportWidth / WORLD_WIDTH, viewportHeight / WORLD_HEIGHT)
  }

  scale(viewportWidth: number, viewportHeight: number): number {
    return this.fitScale(viewportWidth, viewportHeight) * this.zoom
  }

  viewSize(viewportWidth: number, viewportHeight: number): { w: number; h: number } {
    const s = this.scale(viewportWidth, viewportHeight)
    return { w: viewportWidth / s, h: viewportHeight / s }
  }

  clampToWorld(viewportWidth: number, viewportHeight: number): void {
    const view = this.viewSize(viewportWidth, viewportHeight)
    if (view.w >= WORLD_WIDTH) {
      this.x = WORLD_WIDTH / 2
    } else {
      this.x = clamp(this.x, view.w / 2, WORLD_WIDTH - view.w / 2)
    }
    if (view.h >= WORLD_HEIGHT) {
      this.y = WORLD_HEIGHT / 2
    } else {
      this.y = clamp(this.y, view.h / 2, WORLD_HEIGHT - view.h / 2)
    }
  }

  panBy(dxWorld: number, dyWorld: number, viewportWidth: number, viewportHeight: number): void {
    this.x += dxWorld
    this.y += dyWorld
    this.clampToWorld(viewportWidth, viewportHeight)
  }

  screenToWorld(
    screenX: number,
    screenY: number,
    viewportWidth: number,
    viewportHeight: number,
  ): { x: number; y: number } {
    const s = this.scale(viewportWidth, viewportHeight)
    return {
      x: this.x + (screenX - viewportWidth / 2) / s,
      y: this.y + (screenY - viewportHeight / 2) / s,
    }
  }

  zoomAt(
    screenX: number,
    screenY: number,
    factor: number,
    viewportWidth: number,
    viewportHeight: number,
  ): void {
    const before = this.screenToWorld(screenX, screenY, viewportWidth, viewportHeight)
    this.zoom = clamp(this.zoom * factor, MIN_ZOOM, MAX_ZOOM)
    const s = this.scale(viewportWidth, viewportHeight)
    this.x = before.x - (screenX - viewportWidth / 2) / s
    this.y = before.y - (screenY - viewportHeight / 2) / s
    this.clampToWorld(viewportWidth, viewportHeight)
  }

  applyTransform(
    ctx: CanvasRenderingContext2D,
    viewportWidth: number,
    viewportHeight: number,
  ): void {
    const s = this.scale(viewportWidth, viewportHeight)
    ctx.translate(viewportWidth / 2, viewportHeight / 2)
    ctx.scale(s, s)
    ctx.translate(-this.x, -this.y)
  }
}
