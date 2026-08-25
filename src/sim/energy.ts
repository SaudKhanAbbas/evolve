import { creatureRadius } from './creature'
import type { Creature } from './creature'
import { ENERGY } from './config'
import { FOOD_RADIUS } from './food'
import type { Food } from './food'
import type { SpatialHash } from './spatialHash'
import { clamp, distSq } from '../utils/math'

export function metabolicCostPerSec(creature: Creature): number {
  const g = creature.genome
  return ENERGY.metabolicRate * g.metabolism * Math.sqrt(g.size)
}

export function movementCostPerSec(creature: Creature): number {
  const speedSq = creature.vx * creature.vx + creature.vy * creature.vy
  return ENERGY.moveCost * speedSq * creature.genome.size * creature.genome.metabolism
}

export function eatRadius(creature: Creature): number {
  return creatureRadius(creature.genome.size) + FOOD_RADIUS
}

export function plantDigestionEfficiency(diet: number): number {
  return clamp(1 - 0.75 * Math.max(0, diet), 0.25, 1)
}

export function findNearestFood(
  creature: Creature,
  foods: readonly Food[],
  foodEaten: ReadonlySet<number>,
  radius: number,
): Food | null {
  let best: Food | null = null
  let bestDistSq = radius * radius
  for (const f of foods) {
    if (foodEaten.has(f.id)) continue
    const d = distSq(creature.x, creature.y, f.x, f.y)
    if (d <= bestDistSq) {
      bestDistSq = d
      best = f
    }
  }
  return best
}

export function findNearestFoodViaHash(
  creature: Creature,
  hash: SpatialHash<Food>,
  foodEaten: ReadonlySet<number>,
  radius: number,
  scratch: Food[],
): Food | null {
  hash.queryInto(creature.x, creature.y, radius, scratch)
  let best: Food | null = null
  let bestDistSq = radius * radius
  for (let i = 0; i < scratch.length; i++) {
    const f = scratch[i]
    if (foodEaten.has(f.id)) continue
    const d = distSq(creature.x, creature.y, f.x, f.y)
    if (d <= bestDistSq) {
      bestDistSq = d
      best = f
    }
  }
  return best
}

export function consumeFood(creature: Creature, capacity: number, food: Food): void {
  const efficiency = plantDigestionEfficiency(creature.genome.diet)
  const gain = Math.min(food.value * efficiency, capacity - creature.energy)
  if (gain > 0) {
    creature.energy += gain
  }
  food.value = 0
}
