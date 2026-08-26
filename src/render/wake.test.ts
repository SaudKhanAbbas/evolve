import { describe, expect, it } from 'vitest'
import { WakeSystem, wakeEligible, wakeStrength } from './wake'

describe('wakeEligible', () => {
  it('never grants wakes to distant creatures', () => {
    expect(wakeEligible('distant', 1, 3)).toBe(false)
  })

  it('grants low-tier wakes only to fast, large creatures', () => {
    expect(wakeEligible('low', 0.9, 2.2)).toBe(true)
    expect(wakeEligible('low', 0.5, 2.2)).toBe(false)
    expect(wakeEligible('low', 0.9, 1.2)).toBe(false)
  })

  it('grants medium and high wakes to moving creatures', () => {
    expect(wakeEligible('medium', 0.4, 1)).toBe(true)
    expect(wakeEligible('high', 0.3, 1)).toBe(true)
    expect(wakeEligible('medium', 0.1, 1)).toBe(false)
  })
})

describe('wakeStrength', () => {
  it('scales with detail tier and speed, staying bounded', () => {
    expect(wakeStrength('high', 1)).toBeGreaterThan(wakeStrength('medium', 1))
    expect(wakeStrength('medium', 1)).toBeGreaterThan(wakeStrength('low', 1))
    expect(wakeStrength('high', 0.1)).toBeLessThan(wakeStrength('high', 1))
    for (const tier of ['high', 'medium', 'low'] as const) {
      for (const s of [0, 0.5, 1]) {
        const v = wakeStrength(tier, s)
        expect(v).toBeGreaterThan(0)
        expect(v).toBeLessThanOrEqual(0.5)
      }
    }
  })
})

describe('WakeSystem', () => {
  it('bounds each trail to eight sampled points', () => {
    const ws = new WakeSystem()
    for (let i = 0; i < 50; i++) {
      ws.mark(1, 1, i, i, 200, 1, i * 0.2, 0.4)
    }
    const trail = ws.trailForTest(1)
    expect(trail?.count).toBe(8)
  })

  it('prunes trails for creatures that died', () => {
    const ws = new WakeSystem()
    ws.mark(1, 1, 0, 0, 200, 1, 0, 0.4)
    ws.mark(2, 1, 5, 5, 200, 1, 0, 0.4)
    ws.mark(1, 2, 1, 1, 200, 1, 1, 0.4)
    ws.endTick(2)
    expect(ws.size).toBe(1)
    expect(ws.trailForTest(1)).toBeDefined()
    expect(ws.trailForTest(2)).toBeUndefined()
  })

  it('respects the sampling interval', () => {
    const ws = new WakeSystem()
    ws.mark(1, 1, 0, 0, 200, 1, 0, 0.4)
    expect(ws.trailForTest(1)?.count ?? 0).toBe(0)
    ws.mark(1, 1, 1, 1, 200, 1, 0.01, 0.4)
    expect(ws.trailForTest(1)?.count ?? 0).toBe(0)
    ws.mark(1, 1, 2, 2, 200, 1, 0.1, 0.4)
    expect(ws.trailForTest(1)?.count).toBe(1)
    ws.mark(1, 1, 3, 3, 200, 1, 0.25, 0.4)
    expect(ws.trailForTest(1)?.count).toBe(2)
  })
})
