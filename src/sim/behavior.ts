import type { Creature } from './creature'
import { SPEED_SCALE } from './config'
import type { Genome } from './genome'
import type { Rng } from './rng'
import { TAU } from '../utils/math'

export interface SteerTarget {
  x: number
  y: number
}

export interface SteeringContext {
  nearestFood: SteerTarget | null
  threat: SteerTarget | null
}

const WANDER_SPEED_FRACTION = 0.55
const WANDER_TURN_STD = 0.22
const SEEK_TURN_RATE = 4

export function maxSpeedPx(genome: Genome): number {
  return genome.maxSpeed * SPEED_SCALE
}

function turnToward(heading: number, targetAngle: number, maxTurn: number): number {
  let diff = (targetAngle - heading) % TAU
  if (diff > Math.PI) diff -= TAU
  if (diff < -Math.PI) diff += TAU
  return heading + Math.max(-maxTurn, Math.min(maxTurn, diff))
}

export function applySteering(
  creature: Creature,
  rng: Rng,
  ctx: SteeringContext,
  dt: number,
): void {
  const speedLimit = maxSpeedPx(creature.genome)

  if (ctx.threat !== null) {
    const away = Math.atan2(creature.y - ctx.threat.y, creature.x - ctx.threat.x)
    creature.heading = turnToward(creature.heading, away, SEEK_TURN_RATE * dt * 2)
    setVelocity(creature, speedLimit)
    return
  }

  if (ctx.nearestFood !== null) {
    const toward = Math.atan2(ctx.nearestFood.y - creature.y, ctx.nearestFood.x - creature.x)
    creature.heading = turnToward(creature.heading, toward, SEEK_TURN_RATE * dt)
    setVelocity(creature, speedLimit)
    return
  }

  creature.heading += rng.gauss(0, WANDER_TURN_STD)
  creature.heading %= TAU
  setVelocity(creature, speedLimit * WANDER_SPEED_FRACTION)
}

function setVelocity(creature: Creature, speed: number): void {
  creature.vx = Math.cos(creature.heading) * speed
  creature.vy = Math.sin(creature.heading) * speed
}

export function integrateMotion(
  creature: Creature,
  dt: number,
  worldWidth: number,
  worldHeight: number,
): void {
  creature.x += creature.vx * dt
  creature.y += creature.vy * dt

  const margin = 2
  if (creature.x < margin || creature.x > worldWidth - margin) {
    creature.x = Math.min(Math.max(creature.x, margin), worldWidth - margin)
    creature.heading = Math.PI - creature.heading
    creature.vx = -creature.vx
  }
  if (creature.y < margin || creature.y > worldHeight - margin) {
    creature.y = Math.min(Math.max(creature.y, margin), worldHeight - margin)
    creature.heading = -creature.heading
    creature.vy = -creature.vy
  }
}
