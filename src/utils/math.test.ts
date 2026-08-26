import { describe, expect, it } from 'vitest'
import { TAU, lerpAngle, smoothstep } from './math'

function angularlyEqual(a: number, b: number): boolean {
  const d = ((((a - b) % TAU) + TAU * 1.5) % TAU) - TAU / 2
  return Math.abs(d) < 1e-9
}

describe('lerpAngle', () => {
  it('interpolates within a continuous range', () => {
    expect(lerpAngle(0.1, 0.3, 0.5)).toBeCloseTo(0.2, 10)
    expect(lerpAngle(-1, 1, 0.5)).toBeCloseTo(0, 10)
  })

  it('takes the short way across the wrap-around boundary', () => {
    const mid = lerpAngle(6.2, 0.1, 0.5)
    expect(mid).toBeCloseTo(6.2915927, 5)
    expect(lerpAngle(0, TAU - 0.2, 0.5)).toBeCloseTo(-0.1, 10)
  })

  it('returns equivalent angles at t=0 and t=1', () => {
    expect(lerpAngle(1, 5, 0)).toBeCloseTo(1, 10)
    expect(angularlyEqual(lerpAngle(1, 5, 1), 5)).toBe(true)
    expect(angularlyEqual(lerpAngle(6.2, 0.1, 1), 0.1)).toBe(true)
  })
})

describe('smoothstep', () => {
  it('clamps outside inputs and eases the middle', () => {
    expect(smoothstep(-1)).toBe(0)
    expect(smoothstep(0)).toBe(0)
    expect(smoothstep(0.5)).toBeCloseTo(0.5, 10)
    expect(smoothstep(1)).toBe(1)
    expect(smoothstep(2)).toBe(1)
  })
})
