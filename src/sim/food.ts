import { ENERGY, FOOD_CAPACITY, REGEN_RATE_PER_SEC, TICK_DURATION } from './config'
import type { WorldState } from './world'
import type { Rng } from './rng'

export interface Food {
  id: number
  x: number
  y: number
  value: number
}

export const FOOD_RADIUS = 2.5

export function createFood(id: number, x: number, y: number, value: number): Food {
  return { id, x, y, value }
}

export function spawnRandomFood(world: WorldState, rng: Rng): void {
  world.food.push(
    createFood(
      world.nextEntityId++,
      rng.range(0, world.width),
      rng.range(0, world.height),
      ENERGY.plantValue,
    ),
  )
}

export function regrowFood(world: WorldState, rng: Rng): void {
  const liveCount = world.food.length
  const deficit = FOOD_CAPACITY - liveCount
  if (deficit <= 0) return

  const regenPerTick = REGEN_RATE_PER_SEC * (deficit / FOOD_CAPACITY)
  world.foodDebt += regenPerTick * TICK_DURATION
  while (world.foodDebt >= 1) {
    spawnRandomFood(world, rng)
    world.foodDebt -= 1
  }
}
