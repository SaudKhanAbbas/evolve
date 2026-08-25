import { MAX_CREATURES, SPATIAL_CELL_SIZE, TICK_DURATION } from './config'
import { applySteering, integrateMotion } from './behavior'
import type { Creature } from './creature'
import {
  consumeFood,
  eatRadius,
  findNearestFoodViaHash,
  metabolicCostPerSec,
  movementCostPerSec,
} from './energy'
import type { Food } from './food'
import { regrowFood } from './food'
import { canReproduce, reproduce } from './reproduction'
import { Rng } from './rng'
import { SpatialHash } from './spatialHash'
import { createInitialWorld, creatureCapacity } from './world'
import type { WorldState } from './world'
import { distSq } from '../utils/math'

export class Simulation {
  readonly seed: number
  readonly rng: Rng
  readonly world: WorldState
  private readonly allowRegrowth: boolean
  private readonly foodHash: SpatialHash<Food>
  private readonly foodScratch: Food[] = []

  constructor(seed: number, allowRegrowth = true) {
    this.seed = seed
    this.rng = new Rng(seed)
    this.allowRegrowth = allowRegrowth
    this.world = createInitialWorld(this.rng)
    this.foodHash = new SpatialHash<Food>({
      worldWidth: this.world.width,
      worldHeight: this.world.height,
      cellSize: SPATIAL_CELL_SIZE,
    })
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

    this.rebuildFoodIndex()

    const eatenFoodIds = new Set<number>()
    let someoneDied = false

    for (const creature of world.creatures) {
      if (!creature.alive) continue
      const died = this.updateCreature(creature, dt, eatenFoodIds)
      someoneDied = someoneDied || died
    }

    this.reproduceEligible()
    if (this.allowRegrowth) {
      regrowFood(world, this.rng)
    }

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

    const nearest = findNearestFoodViaHash(
      creature,
      this.foodHash,
      eatenFoodIds,
      creature.genome.senseRadius,
      this.foodScratch,
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

  private rebuildFoodIndex(): void {
    this.foodHash.clear()
    for (const food of this.world.food) {
      this.foodHash.insert(food.x, food.y, food)
    }
  }

  private reproduceEligible(): void {
    const world = this.world
    if (world.creatures.length >= MAX_CREATURES) return

    const births: Creature[] = []
    for (const creature of world.creatures) {
      if (!canReproduce(creature)) continue
      births.push(reproduce(creature, world.nextEntityId++, this.rng))
      if (world.creatures.length + births.length >= MAX_CREATURES) break
    }
    if (births.length > 0) {
      world.creatures.push(...births)
    }
  }
}
