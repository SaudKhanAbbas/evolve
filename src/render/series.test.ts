import { describe, expect, it } from 'vitest'
import { Series } from './series'

describe('Series', () => {
  it('pushes values and reports the last one', () => {
    const s = new Series(5)
    s.push(1)
    s.push(2)
    expect(s.length).toBe(2)
    expect(s.last()).toBe(2)
  })

  it('evicts the oldest value beyond capacity', () => {
    const s = new Series(3)
    for (const v of [10, 20, 30, 40, 50]) s.push(v)
    expect(s.length).toBe(3)
    expect(s.values).toEqual([30, 40, 50])
  })

  it('ignores non-finite values', () => {
    const s = new Series(4)
    s.push(1)
    s.push(Number.NaN)
    s.push(Number.POSITIVE_INFINITY)
    s.push(2)
    expect(s.values).toEqual([1, 2])
  })

  it('computes ranges with padding for flat data', () => {
    const s = new Series(4)
    s.push(7)
    s.push(7)
    const padded = s.paddedRange()
    expect(padded?.min).toBeCloseTo(6, 6)
    expect(padded?.max).toBeCloseTo(8, 6)
  })

  it('pads varying data by 12 percent on each side', () => {
    const s = new Series(4)
    s.push(0)
    s.push(100)
    const padded = s.paddedRange()
    expect(padded?.min).toBeCloseTo(-12, 6)
    expect(padded?.max).toBeCloseTo(112, 6)
  })

  it('returns null ranges when empty', () => {
    const s = new Series(4)
    expect(s.range()).toBeNull()
    expect(s.paddedRange()).toBeNull()
    expect(s.last()).toBeNull()
  })
})
