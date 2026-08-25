import { TICK_DURATION } from './config'
import { applySteering, integrateMotion } from './behavior'
import type { Creature } from './creature'
import {
  consumeFood,
  eatRadius,
  findNearestFood,
  metabolicCostPerSec,
  movementCostPerSec,
} from './energy'
import { regrowFood } from './food'
import { Rng } from './rng'
import { createInitialWorld, creatureCapacity } from './world'
import type { WorldState } from './world'
import { distSq } from '../utils/math'

export class Simulation {
  readonly seed: number
  readonly rng: Rng
  readonly world: WorldState

  constructor(seed: number) {
    this.seed = seed
    this.rng = new Rng(seed)
    this.world = createInitialWorld(this.rng)
  }

  get tick(): number {
    return this.world.tick
  }

  get time(): number {
    return this.world.time
  }

  step(): void {
    this.update(TICK_DURATION)
  }

  advance(seconds: number): void {
    let remaining = seconds
    while (remaining >= TICK_DURATION - 1e-9) {
      this.step()
      remaining -= TICK_DURATION
    }
  }

  protected update(dt: number): void {
    const world = this.world
    world.tick += 1
    world.time += dt

    const eatenFoodIds = new Set<number>()
    let someoneDied = false

    for (const creature of world.creatures) {
      if (!creature.alive) continue
      const died = this.updateCreature(creature, dt, eatenFoodIds)
      someoneDied = someoneDied || died
    }

    regrowFood(world, this.rng)

    if (someoneDied) {
      world.creatures = world.creatures.filter((c) => c.alive)
    }
    if (eatenFoodIds.size > 0) {
      world.food = world.food.filter((f) => f.value > 0)
    }
  }

  private updateCreature(creature: Creature, dt: number, eatenFoodIds: Set<number>): boolean {
    const capacity = creatureCapacity(creature.genome)

    creature.age += dt
    if (creature.reproductionCooldown > 0) creature.reproductionCooldown -= 1

    const nearest = findNearestFood(
      creature,
      this.world.food,
      eatenFoodIds,
      creature.genome.senseRadius,
    )
    applySteering(creature, this.rng, { nearestFood: nearest, threat: null }, dt)
    integrateMotion(creature, dt, this.world.width, this.world.height)

    const drainPerSec = metabolicCostPerSec(creature) + movementCostPerSec(creature)
    creature.energy -= drainPerSec * dt

    if (creature.energy > 0 && nearest !== null && creature.energy < capacity - 1e-6) {
      const eatRange = eatRadius(creature)
      if (distSq(creature.x, creature.y, nearest.x, nearest.y) <= eatRange * eatRange) {
        consumeFood(creature, capacity, nearest)
        eatenFoodIds.add(nearest.id)
      }
    }

    if (creature.energy <= 0) {
      creature.alive = false
      return true
    }
    return false
  }
}
