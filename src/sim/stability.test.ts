import { describe, expect, it } from 'vitest'
import { FOOD_CAPACITY, MAX_CREATURES } from './config'
import type { Creature } from './creature'
import { Simulation } from './simulation'

function runHeadless(seed: number, ticks: number): Simulation {
  const sim = new Simulation(seed)
  for (let i = 0; i < ticks; i++) sim.step()
  return sim
}

function maxGeneration(creatures: readonly Creature[]): number {
  return creatures.reduce((m, c) => Math.max(m, c.generation), 0)
}

function assertFiniteWorld(sim: Simulation): void {
  const { world } = sim
  expect(Number.isFinite(world.time)).toBe(true)
  expect(Number.isFinite(world.foodDebt)).toBe(true)
  for (const c of world.creatures) {
    const capacity = 80 * c.genome.size
    expect(Number.isFinite(c.x)).toBe(true)
    expect(Number.isFinite(c.y)).toBe(true)
    expect(Number.isFinite(c.vx)).toBe(true)
    expect(Number.isFinite(c.vy)).toBe(true)
    expect(Number.isFinite(c.energy)).toBe(true)
    expect(Number.isFinite(c.age)).toBe(true)
    expect(Number.isFinite(c.heading)).toBe(true)
    for (const value of Object.values(c.genome)) {
      expect(Number.isFinite(value)).toBe(true)
    }
    expect(c.energy).toBeGreaterThan(0)
    expect(c.energy).toBeLessThanOrEqual(capacity + 1e-6)
    expect(c.x).toBeGreaterThanOrEqual(0)
    expect(c.x).toBeLessThanOrEqual(world.width)
    expect(c.y).toBeGreaterThanOrEqual(0)
    expect(c.y).toBeLessThanOrEqual(world.height)
  }
  for (const f of world.food) {
    expect(Number.isFinite(f.x)).toBe(true)
    expect(Number.isFinite(f.y)).toBe(true)
    expect(f.value).toBeGreaterThan(0)
  }
}

describe('headless stability', () => {
  it('keeps a living, finite, bounded ecosystem across a long run', () => {
    const sim = runHeadless(1234, 12000)

    assertFiniteWorld(sim)

    const population = sim.world.creatures.length
    expect(population).toBeGreaterThan(100)
    expect(population).toBeLessThanOrEqual(MAX_CREATURES)
    expect(sim.world.food.length).toBeLessThanOrEqual(FOOD_CAPACITY)
    expect(maxGeneration(sim.world.creatures)).toBeGreaterThanOrEqual(15)
  })

  it('exerts real selection pressure: traits drift from their initial spread', () => {
    const sim = runHeadless(777, 12000)
    const avgSpeed =
      sim.world.creatures.reduce((s, c) => s + c.genome.maxSpeed, 0) /
      sim.world.creatures.length
    expect(avgSpeed).toBeGreaterThan(0)
    expect(avgSpeed).toBeLessThan(3)
    expect(maxGeneration(sim.world.creatures)).toBeGreaterThan(5)
  })

  it('reproduces identical history from the same seed', () => {
    const a = runHeadless(42, 6000)
    const b = runHeadless(42, 6000)
    expect(JSON.stringify(a.world)).toBe(JSON.stringify(b.world))
  })

  it('diverges under different seeds', () => {
    const a = runHeadless(1, 3000)
    const b = runHeadless(2, 3000)
    expect(JSON.stringify(a.world.creatures.map((c) => c.x))).not.toBe(
      JSON.stringify(b.world.creatures.map((c) => c.x)),
    )
  })

  it('starves down without regrowth but holds up when regrowth is active', () => {
    const drought = new Simulation(555, false)
    drought.world.food.length = 0
    drought.advance(45)
    expect(drought.world.creatures.length).toBeGreaterThan(0)
    expect(drought.world.creatures.length).toBeLessThan(140)

    const lush = new Simulation(555, true)
    lush.world.food.length = 0
    lush.advance(30)
    assertFiniteWorld(lush)
    expect(lush.world.creatures.length).toBeGreaterThan(100)
    expect(maxGeneration(lush.world.creatures)).toBeGreaterThanOrEqual(1)
  })
})
