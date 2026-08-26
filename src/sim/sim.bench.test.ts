import { describe, expect, it } from 'vitest'
import { Simulation } from './simulation'
import { createCreature } from './creature'

const BENCH = process.env.EVOLVE_BENCH === '1'

describe.skipIf(!BENCH)('simulation benchmark', () => {
  it('measures tick cost at multiple populations', () => {
    for (const targetPop of [300, 600, 900, 1200]) {
      const sim = new Simulation(42)
      sim.advance(30)
      let guard = 0
      while (sim.world.creatures.length < Math.min(targetPop, 880) && guard < 60000) {
        sim.step()
        guard++
      }
      while (sim.world.creatures.length < targetPop) {
        const source = sim.world.creatures[sim.world.creatures.length % 50]
        const clone = createCreature(
          sim.world.nextEntityId++,
          source.x,
          source.y,
          source.heading,
          source.energy * 0.5,
          source.generation,
          { ...source.genome },
        )
        sim.world.creatures.push(clone)
      }
      const ticks = 600
      const start = performance.now()
      for (let i = 0; i < ticks; i++) sim.step()
      const elapsed = performance.now() - start
      const perTick = elapsed / ticks
      console.info(
        `[sim-bench] pop=${sim.world.creatures.length} ` +
          `${perTick.toFixed(3)} ms/tick (${(perTick * 30).toFixed(2)} ms/s of budget)`,
      )
      expect(perTick).toBeGreaterThan(0)
    }
  })
})
