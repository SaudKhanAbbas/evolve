import { TICK_DURATION } from './config'
import { Rng } from './rng'
import { createInitialWorld } from './world'
import type { WorldState } from './world'

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
    this.world.tick += 1
    this.world.time += dt
  }
}
