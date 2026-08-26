import type { Creature } from '../sim/creature'
import { SPEED_SCALE } from '../sim/config'
import { drawBloom } from './bloom'
import { morphologyFor } from './morphology'
import type { Morphology } from './morphology'
import { TAU, clamp, smoothstep } from '../utils/math'

const LOD_SCREEN_RADIUS_PX = 2.6
const TAIL_SEGMENTS = 7

export function drawOrganism(
  ctx: CanvasRenderingContext2D,
  creature: Creature,
  timeSec: number,
  viewScale: number,
  drawX: number = creature.x,
  drawY: number = creature.y,
  drawHeading: number = creature.heading,
  wavePhase: number = timeSec * (5 + creature.genome.metabolism * 4) + creature.id * 1.7,
  lean: number = 0,
): void {
  const g = creature.genome
  const morph: Morphology = morphologyFor(creature.id, g)
  const ry = morph.shape.radiusY
  const hue = morph.hue
  const energyFrac = clamp(creature.energy / (80 * g.size), 0, 1)
  const alpha = 0.5 + 0.45 * energyFrac

  if (ry * viewScale < LOD_SCREEN_RADIUS_PX) {
    drawBloom(ctx, hue, drawX, drawY, Math.max(morph.shape.radiusX, ry) * 1.7, alpha * 0.85)
    ctx.fillStyle = `hsla(${hue}, 90%, 82%, ${alpha})`
    ctx.beginPath()
    ctx.arc(drawX, drawY, ry * 0.55, 0, TAU)
    ctx.fill()
    return
  }

  const speedNorm = clamp(Math.hypot(creature.vx, creature.vy) / (g.maxSpeed * SPEED_SCALE), 0, 1)
  const idleBob = (1 - smoothstep(speedNorm)) * Math.sin(wavePhase * 0.33 + creature.id) * ry * 0.08

  ctx.save()
  ctx.translate(drawX, drawY)
  ctx.rotate(drawHeading + lean * 0.12)
  ctx.translate(0, idleBob)

  drawBloom(ctx, hue, 0, 0, Math.max(morph.shape.radiusX, ry) * 2.3, alpha * 0.7)

  drawTail()
  if (g.aggression > 0.15) {
    drawFins()
  }

  ctx.globalAlpha = alpha
  ctx.fillStyle = morph.colors.body
  ctx.fill(morph.bodyPath)

  ctx.beginPath()
  ctx.ellipse(
    morph.shape.radiusX * 0.18,
    -ry * 0.12,
    morph.shape.radiusX * 0.74,
    ry * 0.66,
    0,
    0,
    TAU,
  )
  ctx.fillStyle = morph.colors.bodyCore
  ctx.fill()

  for (const o of morph.organelles) {
    const angle = o.phase + timeSec * o.driftSpeed
    const cx =
      o.anchorX * morph.shape.radiusX + Math.cos(angle) * o.orbitRadius * morph.shape.radiusX
    const cy = o.anchorY * ry + Math.sin(angle) * o.orbitRadius * ry
    const r = Math.max(o.radiusFactor * ry, 0.8)
    ctx.fillStyle = o.bright ? `hsla(${hue}, 85%, 88%, 0.55)` : `hsla(${hue}, 65%, 76%, 0.38)`
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, TAU)
    ctx.fill()
  }

  ctx.strokeStyle = morph.colors.rim
  ctx.lineWidth = Math.max(ry * 0.06, 0.5)
  ctx.stroke(morph.rimPath)

  const pulse = 1 + 0.08 * Math.sin(wavePhase * 0.8)
  ctx.fillStyle = 'rgba(235, 255, 250, 0.75)'
  ctx.beginPath()
  ctx.ellipse(morph.shape.radiusX * 0.3, 0, ry * 0.32 * pulse, ry * 0.26 * pulse, 0, 0, TAU)
  ctx.fill()

  if (Math.abs(g.diet) > 0.2) {
    ctx.fillStyle = morph.colors.speck
    ctx.beginPath()
    ctx.arc(-morph.shape.radiusX * 0.15, 0, ry * 0.18, 0, TAU)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  ctx.restore()

  function drawTail(): void {
    const amp = morph.shape.tailAmplitude * (0.25 + 0.75 * smoothstep(speedNorm))
    const tailLag = -lean * ry * 0.22
    ctx.strokeStyle = morph.colors.tail
    ctx.globalAlpha = alpha
    ctx.lineWidth = Math.max(ry * 0.22, 0.7)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(-morph.shape.radiusX * 0.8 + tailLag, 0)
    for (let i = 1; i <= TAIL_SEGMENTS; i++) {
      const t = i / TAIL_SEGMENTS
      const x = -morph.shape.radiusX * 0.8 + tailLag - morph.shape.tailLength * t
      const y = Math.sin(wavePhase - t * 4.2) * amp * t
      ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  function drawFins(): void {
    const finLen = ry * (0.7 + g.aggression * 0.9)
    const flap = Math.sin(wavePhase) * 0.3
    ctx.globalAlpha = alpha
    ctx.fillStyle = morph.colors.fins
    for (let side = -1; side <= 1; side += 2) {
      const tipAngle = side * (0.9 + flap * side)
      ctx.beginPath()
      ctx.moveTo(morph.shape.radiusX * 0.15, side * ry * 0.72)
      ctx.lineTo(-morph.shape.radiusX * 0.3, side * ry * 0.72)
      ctx.lineTo(
        -morph.shape.radiusX * 0.05 + Math.cos(tipAngle) * finLen * -0.4,
        side * ry * 0.72 + Math.sin(tipAngle) * finLen,
      )
      ctx.closePath()
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}
