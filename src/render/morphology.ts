import type { Genome } from '../sim/genome'

export interface Organelle {
  anchorX: number
  anchorY: number
  radiusFactor: number
  orbitRadius: number
  driftSpeed: number
  phase: number
  bright: boolean
}

export interface Morphology {
  membraneAmp1: number
  membraneFreq1: number
  membranePhase1: number
  membraneAmp2: number
  membraneFreq2: number
  membranePhase2: number
  bodyPoints: number
  organelles: Organelle[]
}

function hash32(seed: number): () => number {
  let state = (seed ^ 0x9e3779b9) >>> 0
  return (): number => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const cache = new Map<number, Morphology>()
const CACHE_LIMIT = 8192

export function morphologyFor(creatureId: number, genome: Genome): Morphology {
  const cached = cache.get(creatureId)
  if (cached) return cached

  const rand = hash32(creatureId + genome.size * 7919)
  const organelleCount = 1 + Math.floor(rand() * 2.999)
  const organelles: Organelle[] = []
  for (let i = 0; i < organelleCount; i++) {
    const angle = rand() * Math.PI * 2
    const dist = Math.sqrt(rand()) * 0.52
    organelles.push({
      anchorX: Math.cos(angle) * dist,
      anchorY: Math.sin(angle) * dist,
      radiusFactor: 0.1 + rand() * 0.1,
      orbitRadius: 0.08 + rand() * 0.14,
      driftSpeed: 0.35 + rand() * 0.8,
      phase: rand() * Math.PI * 2,
      bright: i === 0,
    })
  }

  const morphology: Morphology = {
    membraneAmp1: 0.03 + rand() * 0.03,
    membraneFreq1: 4 + rand() * 3,
    membranePhase1: rand() * Math.PI * 2,
    membraneAmp2: 0.012 + rand() * 0.02,
    membraneFreq2: 8 + rand() * 5,
    membranePhase2: rand() * Math.PI * 2,
    bodyPoints: 18,
    organelles,
  }

  if (cache.size >= CACHE_LIMIT) {
    cache.clear()
  }
  cache.set(creatureId, morphology)
  return morphology
}
