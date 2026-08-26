import { creatureRadius } from '../sim/creature'
import type { Creature } from '../sim/creature'
import type { Genome } from '../sim/genome'
import { paletteHue } from './palette'
import { morphologyFor } from './morphology'
import { creatureCapacity } from '../sim/world'
import { TAU, clamp } from '../utils/math'

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

const TAIL_SEGMENTS = 7

export function drawOrganism(
  ctx: CanvasRenderingContext2D,
  creature: Creature,
  timeSec: number,
  glow: boolean,
): void {
  const g = creature.genome
  const shape = organismShape(g)
  const rx = shape.radiusX
  const ry = shape.radiusY
  const hue = paletteHue(g.hue, g.diet)
  const energyFrac = clamp(creature.energy / creatureCapacity(g), 0, 1)
  const alpha = 0.5 + 0.45 * energyFrac
  const phase = creature.id * 1.7
  const moving = creature.vx * creature.vx + creature.vy * creature.vy > 4
  const wavePhase = timeSec * (5 + g.metabolism * 4) + phase
  const morph = morphologyFor(creature.id, g)

  ctx.save()
  ctx.translate(creature.x, creature.y)
  ctx.rotate(creature.heading)

  drawTail()
  if (g.aggression > 0.15) {
    drawFins()
  }

  if (glow) {
    ctx.shadowBlur = 14
    ctx.shadowColor = `hsla(${hue}, 100%, 65%, 0.9)`
  }

  traceBody(ctx, morph, rx, ry, 1)
  ctx.fillStyle = `hsla(${hue}, 74%, ${44 + energyFrac * 8}%, ${alpha})`
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.save()
  ctx.clip()
  ctx.beginPath()
  ctx.ellipse(rx * 0.18, -ry * 0.12, rx * 0.78, ry * 0.72, 0, 0, TAU)
  ctx.fillStyle = `hsla(${hue}, 80%, ${58 + energyFrac * 10}%, ${0.4 + energyFrac * 0.2})`
  ctx.fill()
  drawOrganelles()
  ctx.restore()

  if (glow && ry >= 5) {
    traceBody(ctx, morph, rx + 2.2, ry + 2.2, 1)
    ctx.strokeStyle = `hsla(${hue}, 100%, 82%, 0.35)`
    ctx.lineWidth = 1.1
    ctx.stroke()
  }

  traceBody(ctx, morph, rx * 0.86, ry * 0.86, 0.94)
  ctx.strokeStyle = `hsla(${hue}, 90%, 84%, ${alpha * 0.3})`
  ctx.lineWidth = Math.max(ry * 0.06, 0.5)
  ctx.stroke()

  const pulse = 1 + 0.08 * Math.sin(wavePhase * 0.8)
  ctx.fillStyle = 'rgba(235, 255, 250, 0.75)'
  ctx.beginPath()
  ctx.ellipse(rx * 0.3, 0, ry * 0.32 * pulse, ry * 0.26 * pulse, 0, 0, TAU)
  ctx.fill()

  const dietStrength = Math.abs(g.diet)
  if (dietStrength > 0.2) {
    ctx.fillStyle =
      g.diet > 0
        ? `rgba(255, 178, 122, ${dietStrength * 0.85})`
        : `rgba(150, 222, 255, ${dietStrength * 0.85})`
    ctx.beginPath()
    ctx.arc(-rx * 0.15, 0, ry * 0.18, 0, TAU)
    ctx.fill()
  }

  ctx.restore()

  function drawOrganelles(): void {
    for (const o of morph.organelles) {
      const angle = o.phase + timeSec * o.driftSpeed
      const cx = o.anchorX * rx + Math.cos(angle) * o.orbitRadius * rx
      const cy = o.anchorY * ry + Math.sin(angle) * o.orbitRadius * ry
      const r = Math.max(o.radiusFactor * ry, 0.8)
      ctx.fillStyle = o.bright
        ? `hsla(${hue}, 85%, 88%, ${alpha * 0.55})`
        : `hsla(${hue}, 65%, 76%, ${alpha * 0.38})`
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, TAU)
      ctx.fill()
    }
  }

  function drawTail(): void {
    const amp = shape.tailAmplitude * (moving ? 1 : 0.35)
    ctx.strokeStyle = `hsla(${hue}, 90%, 68%, ${alpha * 0.65})`
    ctx.lineWidth = Math.max(ry * 0.22, 0.7)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(-rx * 0.8, 0)
    for (let i = 1; i <= TAIL_SEGMENTS; i++) {
      const t = i / TAIL_SEGMENTS
      const x = -rx * 0.8 - shape.tailLength * t
      const y = Math.sin(wavePhase - t * 4.2) * amp * t
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  function drawFins(): void {
    const finLen = ry * (0.7 + g.aggression * 0.9)
    const flap = Math.sin(wavePhase) * 0.3
    ctx.fillStyle = `hsla(${hue}, 88%, 66%, ${alpha * 0.55})`
    for (const side of [-1, 1]) {
      const tipAngle = side * (0.9 + flap * side)
      ctx.beginPath()
      ctx.moveTo(rx * 0.15, side * ry * 0.72)
      ctx.lineTo(-rx * 0.3, side * ry * 0.72)
      ctx.lineTo(
        -rx * 0.05 + Math.cos(tipAngle) * finLen * -0.4,
        side * ry * 0.72 + Math.sin(tipAngle) * finLen,
      )
      ctx.closePath()
      ctx.fill()
    }
  }
}

function traceBody(
  ctx: CanvasRenderingContext2D,
  morph: MorphologyLike,
  rx: number,
  ry: number,
  scale: number,
): void {
  ctx.beginPath()
  for (let i = 0; i <= morph.bodyPoints; i++) {
    const theta = (i / morph.bodyPoints) * TAU
    const wobble =
      1 +
      morph.membraneAmp1 * Math.sin(morph.membraneFreq1 * theta + morph.membranePhase1) +
      morph.membraneAmp2 * Math.sin(morph.membraneFreq2 * theta + morph.membranePhase2)
    const x = Math.cos(theta) * rx * wobble * scale
    const y = Math.sin(theta) * ry * wobble * scale
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.closePath()
}

interface MorphologyLike {
  bodyPoints: number
  membraneAmp1: number
  membraneFreq1: number
  membranePhase1: number
  membraneAmp2: number
  membraneFreq2: number
  membranePhase2: number
}
