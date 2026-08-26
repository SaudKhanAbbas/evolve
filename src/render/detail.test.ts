import { describe, expect, it } from 'vitest'
import { QualityController, detailTier } from './detail'

describe('detailTier', () => {
  it('rises monotonically with screen size', () => {
    const tiers = [1, 3, 6, 14].map((r) => detailTier(r, 1))
    expect(tiers).toEqual(['distant', 'low', 'medium', 'high'])
  })

  it('shifts creatures to cheaper tiers as quality drops', () => {
    expect(detailTier(6, 1)).toBe('medium')
    expect(detailTier(6, 0)).toBe('low')
    expect(detailTier(3, 1)).toBe('low')
    expect(detailTier(3, 0)).toBe('distant')
  })

  it('never returns an unknown tier for extreme inputs', () => {
    expect(detailTier(0, 0)).toBe('distant')
    expect(detailTier(1000, 1)).toBe('high')
    expect(detailTier(-1, 0.5)).toBe('distant')
  })
})

describe('QualityController', () => {
  function run(controller: QualityController, frameMs: number, seconds: number): void {
    const dt = 1 / 60
    const steps = Math.round(seconds * 60)
    for (let i = 0; i < steps; i++) controller.update(frameMs, dt)
  }

  it('starts at full quality', () => {
    expect(new QualityController().quality).toBe(1)
  })

  it('degrades after sustained over-budget frames, not single spikes', () => {
    const c = new QualityController()
    c.update(80, 1 / 60)
    expect(c.quality).toBe(1)
    run(c, 80, 1)
    expect(c.quality).toBe(1)
    run(c, 80, 1.5)
    expect(c.quality).toBeLessThan(1)
  })

  it('recovers quality after sustained smooth frames', () => {
    const c = new QualityController()
    run(c, 60, 2)
    const degraded = c.quality
    expect(degraded).toBeLessThan(1)
    run(c, 5, 5)
    expect(c.quality).toBeGreaterThan(degraded)
    expect(c.quality).toBeLessThanOrEqual(1)
  })

  it('holds level in the comfort band without flicker', () => {
    const c = new QualityController()
    run(c, 10, 5)
    expect(c.quality).toBe(1)
  })

  it('clamps quality between 0 and 1', () => {
    const c = new QualityController()
    run(c, 200, 10)
    expect(c.quality).toBe(0)
    run(c, 3, 60)
    expect(c.quality).toBe(1)
  })

  it('ignores invalid updates', () => {
    const c = new QualityController()
    c.update(Number.NaN, 1 / 60)
    c.update(50, -1)
    expect(c.quality).toBe(1)
  })
})
