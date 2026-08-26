import { describe, expect, it } from 'vitest'
import { Camera } from './camera'
import { WORLD_HEIGHT, WORLD_WIDTH } from '../sim/config'

const VW = 800
const VH = 600

describe('Camera', () => {
  it('starts centered on the world at fit zoom', () => {
    const cam = new Camera()
    expect(cam.x).toBe(WORLD_WIDTH / 2)
    expect(cam.y).toBe(WORLD_HEIGHT / 2)
    expect(cam.zoom).toBe(1)
    const center = cam.screenToWorld(VW / 2, VH / 2, VW, VH)
    expect(center.x).toBeCloseTo(WORLD_WIDTH / 2, 6)
    expect(center.y).toBeCloseTo(WORLD_HEIGHT / 2, 6)
  })

  it('maps screen corners to the expected world region', () => {
    const cam = new Camera()
    const topLeft = cam.screenToWorld(0, 0, VW, VH)
    const bottomRight = cam.screenToWorld(VW, VH, VW, VH)
    expect(topLeft.x).toBeLessThan(WORLD_WIDTH / 2)
    expect(bottomRight.x).toBeGreaterThan(WORLD_WIDTH / 2)
    expect(bottomRight.y - topLeft.y).toBeCloseTo(VH / cam.scale(VW, VH), 3)
  })

  it('keeps the world point under the cursor anchored while zooming', () => {
    const cam = new Camera()
    const sx = 650
    const sy = 200
    const anchor = cam.screenToWorld(sx, sy, VW, VH)
    cam.zoomAt(sx, sy, 2, VW, VH)
    const after = cam.screenToWorld(sx, sy, VW, VH)
    expect(after.x).toBeCloseTo(anchor.x, 4)
    expect(after.y).toBeCloseTo(anchor.y, 4)
  })

  it('respects zoom limits', () => {
    const cam = new Camera()
    for (let i = 0; i < 40; i++) cam.zoomAt(VW / 2, VH / 2, 10, VW, VH)
    expect(cam.zoom).toBeLessThanOrEqual(16.000001)
    for (let i = 0; i < 40; i++) cam.zoomAt(VW / 2, VH / 2, 0.01, VW, VH)
    expect(cam.zoom).toBeGreaterThanOrEqual(0.999999)
  })

  it('cannot pan the view outside the world bounds', () => {
    const cam = new Camera()
    cam.zoomAt(VW / 2, VH / 2, 8, VW, VH)
    cam.panBy(-100000, -100000, VW, VH)
    const view = cam.viewSize(VW, VH)
    expect(cam.x).toBeGreaterThanOrEqual(view.w / 2 - 1e-6)
    expect(cam.y).toBeGreaterThanOrEqual(view.h / 2 - 1e-6)
    cam.panBy(100000, 100000, VW, VH)
    expect(cam.x).toBeLessThanOrEqual(WORLD_WIDTH - view.w / 2 + 1e-6)
    expect(cam.y).toBeLessThanOrEqual(WORLD_HEIGHT - view.h / 2 + 1e-6)
  })

  it('centers the world when the viewport is larger than a fit view', () => {
    const cam = new Camera()
    cam.zoomAt(VW / 2, VH / 2, 0.5, VW, VH)
    expect(cam.zoom).toBe(1)
    const wideViewportW = WORLD_WIDTH * 4
    cam.panBy(500, 500, wideViewportW, VH)
    expect(cam.x).toBe(WORLD_WIDTH / 2)
  })
})
