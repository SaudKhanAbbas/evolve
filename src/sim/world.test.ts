import { describe, expect, it } from 'vitest'
import { INITIAL_CREATURE_COUNT, INITIAL_FOOD_COUNT } from './config'
import { creatureCapacity, createInitialWorld } from './world'
import type { WorldState } from './world'
import { Rng } from './rng'

function snapshot(world: WorldState): string {
  return JSON.stringify(world)
}

describe('world', () => {
  it('spawns the initial population and food supply', () => {
    const world = createInitialWorld(new Rng(10))
    expect(world.creatures).toHaveLength(INITIAL_CREATURE_COUNT)
    expect(world.food).toHaveLength(INITIAL_FOOD_COUNT)
    expect(world.tick).toBe(0)
  })

  it('assigns unique ids across all entities', () => {
    const world = createInitialWorld(new Rng(11))
    const ids = new Set<number>()
    for (const c of world.creatures) ids.add(c.id)
    for (const f of world.food) ids.add(f.id)
    expect(ids.size).toBe(world.creatures.length + world.food.length)
  })

  it('places entities inside the arena and gives creatures sane energy', () => {
    const world = createInitialWorld(new Rng(12))
    for (const c of world.creatures) {
      expect(c.x).toBeGreaterThanOrEqual(0)
      expect(c.x).toBeLessThanOrEqual(world.width)
      expect(c.y).toBeGreaterThanOrEqual(0)
      expect(c.y).toBeLessThanOrEqual(world.height)
      const capacity = creatureCapacity(c.genome)
      expect(c.energy).toBeGreaterThan(0)
      expect(c.energy).toBeLessThan(capacity)
      expect(c.generation).toBe(0)
    }
    for (const f of world.food) {
      expect(f.x).toBeGreaterThanOrEqual(0)
      expect(f.x).toBeLessThanOrEqual(world.width)
      expect(f.value).toBeGreaterThan(0)
    }
  })

  it('produces identical initial worlds for the same seed', () => {
    expect(snapshot(createInitialWorld(new Rng(42)))).toBe(
      snapshot(createInitialWorld(new Rng(42))),
    )
  })
})
