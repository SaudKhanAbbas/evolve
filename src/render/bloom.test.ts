import { describe, expect, it } from 'vitest'
import { bloomBucket } from './bloom'

describe('bloomBucket', () => {
  it('maps the full hue circle into valid stable buckets, including warm hues', () => {
    for (let h = -360; h < 720; h += 7) {
      const bucket = bloomBucket(h)
      expect(bucket).toBeGreaterThanOrEqual(0)
      expect(bucket).toBeLessThanOrEqual(23)
      expect(Number.isInteger(bucket)).toBe(true)
    }
    expect(bloomBucket(20)).toBeLessThan(4)
    expect(bloomBucket(200)).toBeGreaterThan(10)
    expect(bloomBucket(320)).toBeGreaterThan(18)
  })

  it('is deterministic', () => {
    expect(bloomBucket(123.4)).toBe(bloomBucket(123.4))
  })
})
