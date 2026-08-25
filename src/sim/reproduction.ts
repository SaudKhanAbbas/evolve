import { createCreature } from './creature'
import type { Creature } from './creature'
import { ENERGY } from './config'
import { mutateGenome } from './genome'
import type { Rng } from './rng'
import { creatureCapacity } from './world'

const SPAWN_OFFSET_STD = 8

export function canReproduce(creature: Creature): boolean {
  return (
    creature.alive &&
    creature.reproductionCooldown <= 0 &&
    creature.age >= creature.genome.maturityAge &&
    creature.energy >= creatureCapacity(creature.genome) * ENERGY.reproductionThreshold
  )
}

export function reproduce(parent: Creature, id: number, rng: Rng): Creature {
  const childPool = (parent.energy - ENERGY.birthCost) * ENERGY.childShare
  parent.energy -= childPool + ENERGY.birthCost

  parent.offspringCount += 1
  parent.reproductionCooldown = ENERGY.cooldownTicks

  const child = createCreature(
    id,
    parent.x + rng.gauss(0, SPAWN_OFFSET_STD),
    parent.y + rng.gauss(0, SPAWN_OFFSET_STD),
    rng.angle(),
    Math.max(childPool, 0),
    parent.generation + 1,
    mutateGenome(parent.genome, rng),
  )
  child.reproductionCooldown = ENERGY.cooldownTicks
  return child
}
