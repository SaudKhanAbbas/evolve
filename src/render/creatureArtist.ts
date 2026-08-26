import type { Creature } from '../sim/creature'
import { SPEED_SCALE } from '../sim/config'
import { drawBloom } from './bloom'
import { morphologyFor } from './morphology'
import type { Morphology } from './morphology'
import type { DetailTier } from './detail'
import { TAU, clamp, smoothstep } from '../utils/math'

const TAIL_SEGMENTS = 7

export function drawOrganism(
  ctx: CanvasRenderingContext2D,
  creature: Creature,
  timeSec: number,
  tier: DetailTier,
  drawX: number = creature.x,
  drawY: number = creature.y,
  drawHeading: number = creature.heading,
  wavePhase: number = timeSec * (5 + creature.genome.metabolism * 4) + creature.id * 1.7,
  lean: number = 0,
): void {
  const g = creature.genome
  const morph: Morphology = morphologyFor(creature.id, g)
  const ry = morph.shape.radiusY
  const rx = morph.shape.radiusX
  const hue = morph.hue
  const energyFrac = clamp(creature.energy / (80 * g.size), 0, 1)
  const alpha = 0.5 + 0.45 * energyFrac

  if (tier === 'distant') {
    drawBloom(ctx, hue, drawX, drawY, Math.max(rx, ry) * 1.7, alpha * 0.85)
    ctx.fillStyle = `hsla(${hue}, 90%, 82%, ${alpha})`
    ctx.beginPath()
    ctx.arc(drawX, drawY, ry * 0.55, 0, TAU)
    ctx.fill()
    return
  }

  const speedNorm = clamp(Math.hypot(creature.vx, creature.vy) / (g.maxSpeed * SPEED_SCALE), 0, 1)

  if (tier === 'low') {
    drawBloom(ctx, hue, drawX, drawY, Math.max(rx, ry) * 2, alpha * 0.75)
    ctx.save()
    ctx.translate(drawX, drawY)
    ctx.rotate(drawHeading)
    ctx.globalAlpha = alpha
    ctx.strokeStyle = morph.colors.tail
    ctx.lineWidth = Math.max(ry * 0.3, 0.5)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(-rx * 0.6, 0)
    ctx.lineTo(-rx * 0.6 - morph.shape.tailLength * 0.7, 0)
    ctx.stroke()
    ctx.fillStyle = morph.colors.body
    ctx.beginPath()
    ctx.ellipse(0, 0, rx * 0.9, ry * 0.9, 0, 0, TAU)
    ctx.fill()
    ctx.fillStyle = `hsla(${hue}, 100%, 88%, 0.85)`
    ctx.beginPath()
    ctx.arc(rx * 0.3, 0, ry * 0.32, 0, TAU)
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.restore()
    return
  }

  const idleBob = (1 - smoothstep(speedNorm)) * Math.sin(wavePhase * 0.33 + creature.id) * ry * 0.08

  ctx.save()
  ctx.translate(drawX, drawY)
  ctx.rotate(drawHeading + lean * 0.12)
  ctx.translate(0, idleBob)

  drawBloom(ctx, hue, 0, 0, Math.max(rx, ry) * 2.3, alpha * 0.7)

  drawTail()
  if (tier === 'high' && g.aggression > 0.15) {
    drawFins()
  }

  ctx.globalAlpha = alpha
  ctx.fillStyle = morph.colors.body
  ctx.fill(morph.bodyPath)

  ctx.beginPath()
  ctx.ellipse(rx * 0.18, -ry * 0.12, rx * 0.74, ry * 0.66, 0, 0, TAU)
  ctx.fillStyle = morph.colors.bodyCore
  ctx.fill()

  if (tier === 'high') {
    for (const o of morph.organelles) {
      const angle = o.phase + timeSec * o.driftSpeed
      const cx = o.anchorX * rx + Math.cos(angle) * o.orbitRadius * rx
      const cy = o.anchorY * ry + Math.sin(angle) * o.orbitRadius * ry
      const r = Math.max(o.radiusFactor * ry, 0.8)
      ctx.fillStyle = o.bright ? `hsla(${hue}, 85%, 88%, 0.55)` : `hsla(${hue}, 65%, 76%, 0.38)`
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, TAU)
      ctx.fill()
    }
  }

  ctx.strokeStyle = morph.colors.rim
  ctx.lineWidth = Math.max(ry * 0.06, 0.5)
  ctx.stroke(morph.rimPath)

  if (tier === 'high') {
    ctx.globalAlpha = alpha * 0.28
    ctx.strokeStyle = `hsla(${hue}, 70%, 88%, 1)`
    ctx.lineWidth = Math.max(ry * 0.09, 0.4)
    ctx.beginPath()
    ctx.moveTo(-rx * 0.55, 0)
    ctx.quadraticCurveTo(-rx * 0.1, ry * 0.1, rx * 0.24, 0)
    ctx.stroke()
    ctx.globalAlpha = alpha
  }

  const pulse = 1 + 0.08 * Math.sin(wavePhase * 0.8)
  ctx.fillStyle = 'rgba(235, 255, 250, 0.75)'
  ctx.beginPath()
  ctx.ellipse(rx * 0.3, 0, ry * 0.32 * pulse, ry * 0.26 * pulse, 0, 0, TAU)
  ctx.fill()

  if (tier === 'high') {
    ctx.fillStyle = `hsla(${hue}, 100%, 92%, ${0.5 + 0.3 * pulse})`
    ctx.beginPath()
    ctx.arc(rx * 0.62, 0, ry * 0.12, 0, TAU)
    ctx.fill()
  }

  if (tier === 'high' && Math.abs(g.diet) > 0.2) {
    ctx.fillStyle = morph.colors.speck
    ctx.beginPath()
    ctx.arc(-rx * 0.15, 0, ry * 0.18, 0, TAU)
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
    ctx.moveTo(-rx * 0.8 + tailLag, 0)
    for (let i = 1; i <= TAIL_SEGMENTS; i++) {
      const t = i / TAIL_SEGMENTS
      const x = -rx * 0.8 + tailLag - morph.shape.tailLength * t
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
      ctx.moveTo(rx * 0.15, side * ry * 0.72)
      ctx.lineTo(-rx * 0.3, side * ry * 0.72)
      ctx.lineTo(
        -rx * 0.05 + Math.cos(tipAngle) * finLen * -0.4,
        side * ry * 0.72 + Math.sin(tipAngle) * finLen,
      )
      ctx.closePath()
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}
