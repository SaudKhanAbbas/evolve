import { describe, expect, it } from 'vitest'
import { morphologyFor } from './morphology'
import type { Genome } from '../sim/genome'

function genome(): Genome {
  return {
    size: 1.2,
    maxSpeed: 1.5,
    senseRadius: 120,
    metabolism: 1,
    diet: -0.5,
    aggression: 0.5,
    maturityAge: 10,
    hue: 200,
  }
}

describe('morphologyFor', () => {
  it('is deterministic for a given creature id', () => {
    const a = morphologyFor(123, genome())
    const b = morphologyFor(123, genome())
    expect(a).toEqual(b)
  })

  it('varies across different creature ids', () => {
    let differ = false
    const base = morphologyFor(1, genome())
    for (let id = 2; id < 60 && !differ; id++) {
      const m = morphologyFor(id, genome())
      if (
        m.membranePhase1 !== base.membranePhase1 ||
        m.organelles.length !== base.organelles.length
      ) {
        differ = true
      }
    }
    expect(differ).toBe(true)
  })

  it('keeps organelle count between one and three', () => {
    for (let id = 0; id < 200; id++) {
      const count = morphologyFor(id, genome()).organelles.length
      expect(count).toBeGreaterThanOrEqual(1)
      expect(count).toBeLessThanOrEqual(3)
    }
  })

  it('places organelles inside the body disc with positive radii', () => {
    for (let id = 0; id < 200; id++) {
      const m = morphologyFor(id, genome())
      for (const o of m.organelles) {
        expect(Math.hypot(o.anchorX, o.anchorY)).toBeLessThan(0.6)
        expect(o.radiusFactor).toBeGreaterThan(0)
        expect(o.orbitRadius).toBeGreaterThan(0)
      }
    }
  })

  it('keeps membrane wobble subtle', () => {
    for (let id = 0; id < 200; id++) {
      const m = morphologyFor(id, genome())
      expect(m.membraneAmp1).toBeLessThan(0.07)
      expect(m.membraneAmp2).toBeLessThan(0.05)
    }
  })
})
