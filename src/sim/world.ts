import {
  ENERGY,
  INITIAL_CREATURE_COUNT,
  INITIAL_FOOD_COUNT,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './config'
import { createCreature } from './creature'
import type { Creature } from './creature'
import { createFood } from './food'
import type { Food } from './food'
import { createRandomGenome } from './genome'
import type { Genome } from './genome'
import type { Rng } from './rng'

export interface WorldState {
  tick: number
  time: number
  width: number
  height: number
  nextEntityId: number
  creatures: Creature[]
  food: Food[]
}

export function creatureCapacity(genome: Genome): number {
  return ENERGY.perSize * genome.size
}

export function createInitialWorld(rng: Rng): WorldState {
  const world: WorldState = {
    tick: 0,
    time: 0,
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    nextEntityId: 1,
    creatures: [],
    food: [],
  }

  for (let i = 0; i < INITIAL_CREATURE_COUNT; i++) {
    const genome = createRandomGenome(rng)
    world.creatures.push(
      createCreature(
        world.nextEntityId++,
        rng.range(0, world.width),
        rng.range(0, world.height),
        rng.angle(),
        creatureCapacity(genome) * ENERGY.startFraction,
        0,
        genome,
      ),
    )
  }

  for (let i = 0; i < INITIAL_FOOD_COUNT; i++) {
    world.food.push(
      createFood(
        world.nextEntityId++,
        rng.range(0, world.width),
        rng.range(0, world.height),
        ENERGY.plantValue,
      ),
    )
  }

  return world
}
