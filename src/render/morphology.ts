import { creatureRadius } from '../sim/creature'
import type { Genome } from '../sim/genome'
import { paletteHue } from './palette'
import { TAU } from '../utils/math'

export interface OrganismShape {
  radiusX: number
  radiusY: number
  tailLength: number
  tailAmplitude: number
}

export function organismShape(genome: Genome): OrganismShape {
  const r = creatureRadius(genome.size)
  const elongation = 1 + ((genome.maxSpeed - 0.5) / 2.5) * 0.85
  return {
    radiusX: r * elongation,
    radiusY: r / Math.sqrt(elongation),
    tailLength: r * (1.2 + genome.maxSpeed * 0.45),
    tailAmplitude: r * (0.22 + genome.maxSpeed * 0.14),
  }
}

export interface Organelle {
  anchorX: number
  anchorY: number
  radiusFactor: number
  orbitRadius: number
  driftSpeed: number
  phase: number
  bright: boolean
}

export interface OrganismColors {
  body: string
  bodyCore: string
  tail: string
  fins: string
  rim: string
  speck: string
}

export interface Morphology {
  shape: OrganismShape
  bodyPath: Path2D
  rimPath: Path2D
  membraneAmp1: number
  membraneFreq1: number
  membranePhase1: number
  membraneAmp2: number
  membraneFreq2: number
  membranePhase2: number
  bodyPoints: number
  organelles: Organelle[]
  colors: OrganismColors
  hue: number
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

function newPath2D(): Path2D {
  if (typeof Path2D !== 'undefined') {
    return new Path2D()
  }
  const stub = {
    moveTo: (): void => {},
    lineTo: (): void => {},
    closePath: (): void => {},
  }
  return stub as unknown as Path2D
}

export function morphologyFor(creatureId: number, genome: Genome): Morphology {
  const cached = cache.get(creatureId)
  if (cached) return cached

  const rand = hash32(creatureId + genome.size * 7919)
  const shape = organismShape(genome)
  const hue = paletteHue(genome.hue, genome.diet)

  const bodyPath = newPath2D()
  const rimPath = newPath2D()
  const bodyPoints = 18
  const membraneAmp1 = 0.03 + rand() * 0.03
  const membraneFreq1 = 4 + rand() * 3
  const membranePhase1 = rand() * Math.PI * 2
  const membraneAmp2 = 0.012 + rand() * 0.02
  const membraneFreq2 = 8 + rand() * 5
  const membranePhase2 = rand() * Math.PI * 2

  for (let i = 0; i <= bodyPoints; i++) {
    const theta = (i / bodyPoints) * TAU
    const wobble =
      1 +
      membraneAmp1 * Math.sin(membraneFreq1 * theta + membranePhase1) +
      membraneAmp2 * Math.sin(membraneFreq2 * theta + membranePhase2)
    const x = Math.cos(theta) * shape.radiusX * wobble
    const y = Math.sin(theta) * shape.radiusY * wobble
    if (i === 0) {
      bodyPath.moveTo(x, y)
      rimPath.moveTo(x * 0.86, y * 0.86)
    } else {
      bodyPath.lineTo(x, y)
      rimPath.lineTo(x * 0.86, y * 0.86)
    }
  }
  bodyPath.closePath()
  rimPath.closePath()

  const organelleCount = 1 + Math.floor(rand() * 2.999)
  const organelles: Organelle[] = []
  for (let i = 0; i < organelleCount; i++) {
    const angle = rand() * TAU
    const dist = Math.sqrt(rand()) * 0.52
    organelles.push({
      anchorX: Math.cos(angle) * dist,
      anchorY: Math.sin(angle) * dist,
      radiusFactor: 0.1 + rand() * 0.1,
      orbitRadius: 0.08 + rand() * 0.14,
      driftSpeed: 0.35 + rand() * 0.8,
      phase: rand() * TAU,
      bright: i === 0,
    })
  }

  const dietStrength = Math.abs(genome.diet)
  const morphology: Morphology = {
    shape,
    bodyPath,
    rimPath,
    membraneAmp1,
    membraneFreq1,
    membranePhase1,
    membraneAmp2,
    membraneFreq2,
    membranePhase2,
    bodyPoints,
    organelles,
    hue,
    colors: {
      body: `hsla(${hue}, 74%, 48%, 1)`,
      bodyCore: `hsla(${hue}, 80%, 62%, 0.5)`,
      tail: `hsla(${hue}, 90%, 68%, 0.62)`,
      fins: `hsla(${hue}, 88%, 66%, 0.5)`,
      rim: `hsla(${hue}, 90%, 84%, 0.3)`,
      speck:
        genome.diet > 0
          ? `rgba(255, 178, 122, ${dietStrength * 0.85})`
          : `rgba(150, 222, 255, ${dietStrength * 0.85})`,
    },
  }

  if (cache.size >= CACHE_LIMIT) {
    cache.clear()
  }
  cache.set(creatureId, morphology)
  return morphology
}
