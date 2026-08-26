import { creatureRadius } from '../sim/creature'
import type { Creature } from '../sim/creature'
import type { Genome } from '../sim/genome'
import { paletteHue } from './palette'
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
  const elongation = 1 + ((genome.maxSpeed - 0.5) / 2.5) * 0.55
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
  const { radiusX: rx, radiusY: ry } = shape
  const hue = paletteHue(g.hue, g.diet)
  const energyFrac = clamp(creature.energy / creatureCapacity(g), 0, 1)
  const alpha = 0.5 + 0.45 * energyFrac
  const phase = creature.id * 1.7
  const moving = creature.vx * creature.vx + creature.vy * creature.vy > 4
  const wavePhase = timeSec * (5 + g.metabolism * 4) + phase

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
  ctx.fillStyle = `hsla(${hue}, 82%, ${56 + energyFrac * 10}%, ${alpha})`
  ctx.beginPath()
  ctx.ellipse(0, 0, rx, ry, 0, 0, TAU)
  ctx.fill()
  ctx.shadowBlur = 0

  if (glow && ry >= 5) {
    ctx.strokeStyle = `hsla(${hue}, 100%, 80%, 0.32)`
    ctx.lineWidth = 1.1
    ctx.beginPath()
    ctx.ellipse(0, 0, rx + 2.2, ry + 2.2, 0, 0, TAU)
    ctx.stroke()
  }

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
