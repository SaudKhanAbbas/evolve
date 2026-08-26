import { describe, expect, it } from 'vitest'
import { bloomBucket } from './bloom'
import { paletteHue } from './palette'

describe('bloomBucket', () => {
  it('maps every curated palette hue into a valid stable bucket', () => {
    for (let h = 0; h < 360; h += 3) {
      for (const diet of [-1, -0.5, 0, 0.5, 1]) {
        const bucket = bloomBucket(paletteHue(h, diet))
        expect(bucket).toBeGreaterThanOrEqual(0)
        expect(bucket).toBeLessThanOrEqual(23)
        expect(Number.isInteger(bucket)).toBe(true)
      }
    }
  })

  it('is deterministic and monotonic across the curated range', () => {
    expect(bloomBucket(paletteHue(100, -1))).toBe(bloomBucket(paletteHue(100, -1)))
    const low = bloomBucket(paletteHue(5, -1))
    const high = bloomBucket(paletteHue(355, 1))
    expect(high).toBeGreaterThan(low)
  })
})
