import { describe, expect, it } from 'vitest'
import { applySteering, integrateMotion, maxSpeedPx } from './behavior'
import { createCreature } from './creature'
import type { Creature } from './creature'
import { findNearestFood } from './energy'
import { Rng } from './rng'
import { TAU } from '../utils/math'

function makeCreature(x: number, y: number, overrides: Partial<Creature['genome']> = {}): Creature {
  const genome = {
    size: 1,
    maxSpeed: 2,
    senseRadius: 150,
    metabolism: 1,
    diet: -1,
    aggression: 0.5,
    maturityAge: 10,
    hue: 200,
    ...overrides,
  }
  return createCreature(1, x, y, 0, 100, 0, genome)
}

describe('steering', () => {
  it('turns a creature toward nearby food', () => {
    const c = makeCreature(800, 600)
    const food = { x: 900, y: 600 }
    const rng = new Rng(7)
    for (let i = 0; i < 30; i++) {
      applySteering(c, rng, { nearestFood: food, threat: null }, 1 / 30)
    }
    const headingToFood = Math.atan2(food.y - c.y, food.x - c.x)
    let diff = (headingToFood - c.heading) % TAU
    if (diff > Math.PI) diff -= TAU
    if (diff < -Math.PI) diff += TAU
    expect(Math.abs(diff)).toBeLessThan(0.15)
  })

  it('moves at full speed when seeking and reduced speed when wandering', () => {
    const c = makeCreature(500, 500)
    const seekSpeed = maxSpeedPx(c.genome)
    applySteering(c, new Rng(1), { nearestFood: { x: 600, y: 500 }, threat: null }, 1 / 30)
    expect(Math.hypot(c.vx, c.vy)).toBeCloseTo(seekSpeed, 6)

    const w = makeCreature(500, 500)
    applySteering(w, new Rng(2), { nearestFood: null, threat: null }, 1 / 30)
    expect(Math.hypot(w.vx, w.vy)).toBeLessThan(seekSpeed)
    expect(Math.hypot(w.vx, w.vy)).toBeGreaterThan(0)
  })

  it('flees from threats', () => {
    const c = makeCreature(500, 500)
    const threat = { x: 540, y: 500 }
    const rng = new Rng(3)
    let movedAway = false
    for (let i = 0; i < 20 && !movedAway; i++) {
      applySteering(c, rng, { nearestFood: null, threat }, 1 / 30)
      integrateMotion(c, 1 / 30, 1600, 1200)
      if (c.x < 500 - 5) movedAway = true
    }
    expect(movedAway).toBe(true)
  })

  it('respects genome speed differences', () => {
    const slow = makeCreature(0, 0, { maxSpeed: 0.6 })
    const fast = makeCreature(0, 0, { maxSpeed: 3 })
    applySteering(slow, new Rng(4), { nearestFood: { x: 100, y: 0 }, threat: null }, 1 / 30)
    applySteering(fast, new Rng(4), { nearestFood: { x: 100, y: 0 }, threat: null }, 1 / 30)
    expect(Math.hypot(fast.vx, fast.vy)).toBeGreaterThan(Math.hypot(slow.vx, slow.vy))
  })
})

describe('motion integration', () => {
  it('keeps creatures inside the arena walls', () => {
    const c = makeCreature(1599, 1199)
    c.heading = 0.1
    c.vx = 100
    c.vy = 100
    for (let i = 0; i < 200; i++) {
      integrateMotion(c, 1 / 30, 1600, 1200)
    }
    expect(c.x).toBeGreaterThanOrEqual(0)
    expect(c.x).toBeLessThanOrEqual(1600)
    expect(c.y).toBeGreaterThanOrEqual(0)
    expect(c.y).toBeLessThanOrEqual(1200)
  })

  it('reflects velocity off walls instead of getting stuck', () => {
    const c = makeCreature(10, 600)
    c.heading = Math.PI
    c.vx = -60
    c.vy = 0
    integrateMotion(c, 1, 1600, 1200)
    expect(c.vx).toBeGreaterThan(0)
  })
})

describe('sensing', () => {
  it('finds the nearest food within sense radius and nothing beyond it', () => {
    const c = makeCreature(800, 600)
    c.genome.senseRadius = 50
    const far = { id: 1, x: 900, y: 600, value: 30 }
    const near = { id: 2, x: 820, y: 600, value: 30 }
    expect(findNearestFood(c, [far, near], new Set(), 50)?.id).toBe(2)
    expect(findNearestFood(c, [far], new Set(), 50)).toBeNull()
    expect(findNearestFood(c, [near], new Set([2]), 50)).toBeNull()
  })
})
