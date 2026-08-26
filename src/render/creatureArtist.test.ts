import { describe, expect, it } from 'vitest'
import { organismShape } from './creatureArtist'
import type { Genome } from '../sim/genome'

function genome(overrides: Partial<Genome> = {}): Genome {
  return {
    size: 1,
    maxSpeed: 1.5,
    senseRadius: 120,
    metabolism: 1,
    diet: -0.5,
    aggression: 0.5,
    maturityAge: 10,
    hue: 200,
    ...overrides,
  }
}

describe('organismShape', () => {
  it('stretches faster creatures into more streamlined bodies', () => {
    const slow = organismShape(genome({ maxSpeed: 0.5 }))
    const fast = organismShape(genome({ maxSpeed: 3 }))
    expect(fast.radiusX / fast.radiusY).toBeGreaterThan(slow.radiusX / slow.radiusY)
    expect(slow.radiusX / slow.radiusY).toBeCloseTo(1, 5)
  })

  it('gives faster creatures longer tails with wider sweep', () => {
    const slow = organismShape(genome({ maxSpeed: 0.6 }))
    const fast = organismShape(genome({ maxSpeed: 2.8 }))
    expect(fast.tailLength).toBeGreaterThan(slow.tailLength)
    expect(fast.tailAmplitude).toBeGreaterThan(slow.tailAmplitude)
  })

  it('scales the whole body with the size gene', () => {
    const small = organismShape(genome({ size: 0.5 }))
    const large = organismShape(genome({ size: 3 }))
    expect(large.radiusY).toBeGreaterThan(small.radiusY * 2)
    expect(large.tailLength).toBeGreaterThan(small.tailLength)
  })

  it('keeps proportions positive across all gene bounds', () => {
    for (const size of [0.5, 1.75, 3]) {
      for (const maxSpeed of [0.5, 1.75, 3]) {
        const s = organismShape(genome({ size, maxSpeed }))
        for (const v of [s.radiusX, s.radiusY, s.tailLength, s.tailAmplitude]) {
          expect(v).toBeGreaterThan(0)
        }
      }
    }
  })
})
