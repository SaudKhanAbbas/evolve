import { clamp } from '../utils/math'
import { MUTATION } from './config'
import type { Rng } from './rng'

export interface Genome {
  size: number
  maxSpeed: number
  senseRadius: number
  metabolism: number
  diet: number
  aggression: number
  maturityAge: number
  hue: number
}

export type GeneKey = keyof Genome

export interface GeneLimits {
  min: number
  max: number
}

export const GENE_LIMITS: Record<GeneKey, GeneLimits> = {
  size: { min: 0.5, max: 3 },
  maxSpeed: { min: 0.5, max: 3 },
  senseRadius: { min: 20, max: 200 },
  metabolism: { min: 0.5, max: 2 },
  diet: { min: -1, max: 1 },
  aggression: { min: 0, max: 1 },
  maturityAge: { min: 5, max: 30 },
  hue: { min: 0, max: 360 },
}

const GENE_KEYS = Object.keys(GENE_LIMITS) as GeneKey[]

export function createRandomGenome(rng: Rng): Genome {
  return {
    size: rng.range(0.8, 1.8),
    maxSpeed: rng.range(0.8, 2),
    senseRadius: rng.range(60, 160),
    metabolism: rng.range(0.7, 1.4),
    diet: rng.range(-1, 1),
    aggression: rng.range(0, 1),
    maturityAge: rng.range(8, 20),
    hue: rng.range(150, 320),
  }
}

export function cloneGenome(genome: Genome): Genome {
  return { ...genome }
}

export function mutateGenome(genome: Genome, rng: Rng): Genome {
  const child = cloneGenome(genome)
  for (const key of GENE_KEYS) {
    if (rng.next() >= MUTATION.chance) continue
    const { min, max } = GENE_LIMITS[key]
    const sigma = (max - min) * MUTATION.strength
    child[key] = clamp(child[key] + rng.gauss(0, sigma), min, max)
  }
  return child
}

export function isWithinGeneBounds(key: GeneKey, value: number): boolean {
  const { min, max } = GENE_LIMITS[key]
  return value >= min && value <= max
}
