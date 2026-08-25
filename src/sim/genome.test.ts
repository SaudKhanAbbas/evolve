import { describe, expect, it } from 'vitest'
import { GENE_LIMITS, cloneGenome, createRandomGenome, mutateGenome } from './genome'
import type { GeneKey } from './genome'
import { Rng } from './rng'

const GENE_KEYS = Object.keys(GENE_LIMITS) as GeneKey[]

describe('genome', () => {
  it('creates random genomes within bounds', () => {
    const rng = new Rng(5)
    for (let i = 0; i < 500; i++) {
      const genome = createRandomGenome(rng)
      for (const key of GENE_KEYS) {
        const { min, max } = GENE_LIMITS[key]
        expect(genome[key]).toBeGreaterThanOrEqual(min)
        expect(genome[key]).toBeLessThanOrEqual(max)
      }
    }
  })

  it('clones independently of the parent', () => {
    const rng = new Rng(6)
    const parent = createRandomGenome(rng)
    const child = cloneGenome(parent)
    expect(child).toEqual(parent)
    child.size += 1
    child.hue = 0
    expect(parent.size).not.toBe(child.size)
    expect(parent.hue).not.toBe(0)
  })

  it('mutates deterministically for a given seed', () => {
    const parent = createRandomGenome(new Rng(555))
    const rngA = new Rng(777)
    const rngB = new Rng(777)
    for (let i = 0; i < 50; i++) {
      const a = mutateGenome(parent, rngA)
      const b = mutateGenome(parent, rngB)
      expect(a).toEqual(b)
    }
  })

  it('keeps mutated genes within bounds across many mutations', () => {
    const rng = new Rng(12345)
    for (let i = 0; i < 2000; i++) {
      const parent = createRandomGenome(rng)
      const child = mutateGenome(parent, rng)
      for (const key of GENE_KEYS) {
        const { min, max } = GENE_LIMITS[key]
        expect(child[key]).toBeGreaterThanOrEqual(min)
        expect(child[key]).toBeLessThanOrEqual(max)
      }
    }
  })

  it('does not modify the parent genome when mutating', () => {
    const rng = new Rng(8)
    const parent = createRandomGenome(rng)
    const snapshot = { ...parent }
    for (let i = 0; i < 100; i++) {
      mutateGenome(parent, rng)
    }
    expect(parent).toEqual(snapshot)
  })

  it('usually leaves most genes untouched given low mutation chance', () => {
    const rng = new Rng(31415)
    const parent = createRandomGenome(rng)
    let unchanged = 0
    const trials = 2000
    for (let i = 0; i < trials; i++) {
      const child = mutateGenome(parent, rng)
      if (Object.keys(parent).every((k) => child[k as GeneKey] === parent[k as GeneKey])) {
        unchanged++
      }
    }
    const expectedNoMutationRate = Math.pow(1 - 0.12, GENE_KEYS.length)
    expect(unchanged / trials).toBeGreaterThan(expectedNoMutationRate * 0.5)
  })
})
