import { describe, expect, it } from 'vitest'
import { Rng } from './rng'

describe('Rng', () => {
  it('produces identical sequences for identical seeds', () => {
    const a = new Rng(1234)
    const b = new Rng(1234)
    for (let i = 0; i < 1000; i++) {
      expect(a.next()).toBe(b.next())
    }
  })

  it('produces different sequences for different seeds', () => {
    const a = new Rng(1)
    const b = new Rng(2)
    let differ = false
    for (let i = 0; i < 100; i++) {
      if (a.next() !== b.next()) {
        differ = true
        break
      }
    }
    expect(differ).toBe(true)
  })

  it('emits values within [0, 1)', () => {
    const rng = new Rng(42)
    for (let i = 0; i < 10000; i++) {
      const v = rng.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('range stays within bounds', () => {
    const rng = new Rng(7)
    for (let i = 0; i < 5000; i++) {
      const v = rng.range(-3.5, 9.25)
      expect(v).toBeGreaterThanOrEqual(-3.5)
      expect(v).toBeLessThan(9.25)
    }
  })

  it('int stays within [min, maxExclusive)', () => {
    const rng = new Rng(99)
    for (let i = 0; i < 5000; i++) {
      const v = rng.int(2, 6)
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(2)
      expect(v).toBeLessThan(6)
    }
  })

  it('gauss is deterministic and centered near the mean', () => {
    const rng = new Rng(2024)
    let sum = 0
    const n = 20000
    for (let i = 0; i < n; i++) {
      sum += rng.gauss(10, 3)
    }
    const mean = sum / n
    expect(mean).toBeGreaterThan(9.5)
    expect(mean).toBeLessThan(10.5)
    const replayA = new Rng(2024)
    const replayB = new Rng(2024)
    for (let i = 0; i < n; i++) {
      expect(replayA.gauss(10, 3)).toBe(replayB.gauss(10, 3))
    }
  })
})
