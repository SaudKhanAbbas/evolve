import { describe, expect, it } from 'vitest'
import { CameraRig } from './cameraRig'
import { WORLD_HEIGHT, WORLD_WIDTH } from '../sim/config'

const VW = 800
const VH = 600

describe('CameraRig', () => {
  it('starts aligned with a default camera', () => {
    const rig = new CameraRig()
    expect(rig.actual.x).toBe(WORLD_WIDTH / 2)
    expect(rig.actual.y).toBe(WORLD_HEIGHT / 2)
    expect(rig.actual.zoom).toBe(1)
  })

  it('moves the actual camera toward the pan target without overshooting', () => {
    const rig = new CameraRig()
    rig.zoomAt(VW / 2, VH / 2, 6, VW, VH)
    for (let i = 0; i < 90; i++) {
      rig.update(1 / 60, VW, VH)
    }
    rig.panBy(300, -150, VW, VH)
    const targetX = rig.actual.x + 300
    let lastDist = Number.POSITIVE_INFINITY
    for (let i = 0; i < 90; i++) {
      rig.update(1 / 60, VW, VH)
      const dist = Math.abs(rig.actual.x - targetX)
      expect(dist).toBeLessThanOrEqual(lastDist + 1e-9)
      lastDist = dist
    }
    expect(lastDist).toBeLessThan(1)
  })

  it('converges zoom toward the requested level', () => {
    const rig = new CameraRig()
    rig.zoomAt(VW / 2, VH / 2, 4, VW, VH)
    for (let i = 0; i < 90; i++) {
      rig.update(1 / 60, VW, VH)
    }
    expect(rig.actual.zoom).toBeGreaterThan(3.9)
    expect(rig.actual.zoom).toBeLessThan(4.000001)
  })

  it('never lets the eased view leave the world bounds', () => {
    const rig = new CameraRig()
    rig.zoomAt(VW / 2, VH / 2, 6, VW, VH)
    rig.update(1 / 60, VW, VH)
    rig.panBy(-100000, 100000, VW, VH)
    for (let i = 0; i < 120; i++) {
      rig.update(1 / 60, VW, VH)
      const view = rig.actual.viewSize(VW, VH)
      expect(rig.actual.x).toBeGreaterThanOrEqual(view.w / 2 - 1e-6)
      expect(rig.actual.y).toBeLessThanOrEqual(WORLD_HEIGHT - view.h / 2 + 1e-6)
    }
  })

  it('ignores non-positive deltas', () => {
    const rig = new CameraRig()
    rig.zoomAt(VW / 2, VH / 2, 8, VW, VH)
    rig.update(-1, VW, VH)
    rig.update(0, VW, VH)
    expect(rig.actual.zoom).toBe(1)
  })
})
