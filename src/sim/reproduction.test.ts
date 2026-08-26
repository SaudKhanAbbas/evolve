import { describe, expect, it } from 'vitest'
import { ENERGY } from './config'
import { createCreature } from './creature'
import type { Creature } from './creature'
import { GENE_LIMITS, mutateGenome } from './genome'
import type { GeneKey } from './genome'
import { canReproduce, reproduce } from './reproduction'
import { Rng } from './rng'

const GENE_KEYS = Object.keys(GENE_LIMITS) as GeneKey[]

function makeParent(): Creature {
  const genome = {
    size: 2,
    maxSpeed: 1.5,
    senseRadius: 120,
    metabolism: 1,
    diet: -0.5,
    aggression: 0.5,
    maturityAge: 10,
    hue: 200,
  }
  const c = createCreature(7, 800, 600, 0.5, 150, 3, genome)
  c.age = 20
  return c
}

describe('canReproduce', () => {
  it('blocks immature, low-energy, cooling-down, or dead creatures', () => {
    const threshold = ENERGY.perSize * 2 * ENERGY.reproductionThreshold
    const ready = makeParent()
    expect(canReproduce(ready)).toBe(true)

    const young = makeParent()
    young.age = 5
    expect(canReproduce(young)).toBe(false)

    const hungry = makeParent()
    hungry.energy = threshold - 1
    expect(canReproduce(hungry)).toBe(false)

    const cooling = makeParent()
    cooling.reproductionCooldown = 10
    expect(canReproduce(cooling)).toBe(false)

    const dead = makeParent()
    dead.alive = false
    expect(canReproduce(dead)).toBe(false)
  })
})

describe('reproduce', () => {
  it('splits energy between parent and child with a birth cost', () => {
    const parent = makeParent()
    const before = parent.energy
    const child = reproduce(parent, 8, new Rng(9))
    expect(parent.energy).toBeLessThan(before)
    expect(child.energy).toBeGreaterThan(0)
    expect(parent.energy + child.energy).toBeCloseTo(before - ENERGY.birthCost, 6)
  })

  it('increments generation and offspring tracking', () => {
    const parent = makeParent()
    const child = reproduce(parent, 8, new Rng(10))
    expect(child.generation).toBe(parent.generation + 1)
    expect(child.generation).toBe(4)
    expect(parent.offspringCount).toBe(1)
    expect(parent.reproductionCooldown).toBe(ENERGY.cooldownTicks)
    expect(child.reproductionCooldown).toBe(ENERGY.cooldownTicks)
  })

  it('spawns the child near the parent and inside the arena', () => {
    const rng = new Rng(11)
    for (let i = 0; i < 200; i++) {
      const edgeParent = makeParent()
      edgeParent.x = 1
      edgeParent.y = 1199
      const child = reproduce(edgeParent, 8, rng)
      expect(child.x).toBeGreaterThanOrEqual(2)
      expect(child.x).toBeLessThanOrEqual(1598)
      expect(child.y).toBeGreaterThanOrEqual(2)
      expect(child.y).toBeLessThanOrEqual(1198)
    }
  })

  it('inherits a mutated genome that stays within bounds', () => {
    const rng = new Rng(12)
    for (let i = 0; i < 300; i++) {
      const parent = makeParent()
      const child = reproduce(parent, 100 + i, rng)
      for (const key of GENE_KEYS) {
        const { min, max } = GENE_LIMITS[key]
        expect(child.genome[key]).toBeGreaterThanOrEqual(min)
        expect(child.genome[key]).toBeLessThanOrEqual(max)
      }
    }
  })

  it('does not modify the parent genome while mutating the child genome', () => {
    const parent = makeParent()
    const snapshot = { ...parent.genome }
    reproduce(parent, 8, new Rng(13))
    expect(parent.genome).toEqual(snapshot)
    expect(mutateGenome(parent.genome, new Rng(13))).not.toEqual(parent.genome)
  })

  it('is deterministic for a given seed sequence', () => {
    const runA: string[] = []
    const runB: string[] = []
    for (let i = 0; i < 20; i++) {
      runA.push(JSON.stringify(reproduce(makeParent(), 8, new Rng(999))))
      runB.push(JSON.stringify(reproduce(makeParent(), 8, new Rng(999))))
    }
    expect(runA).toEqual(runB)
  })
})
