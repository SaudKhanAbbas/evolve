import { describe, expect, it } from 'vitest'
import { INITIAL_CREATURE_COUNT, TICK_RATE, WORLD_HEIGHT, WORLD_WIDTH } from './config'
import { Simulation } from './simulation'

describe('Simulation', () => {
  it('advances exactly one tick per step', () => {
    const sim = new Simulation(1)
    expect(sim.tick).toBe(0)
    sim.step()
    sim.step()
    sim.step()
    expect(sim.tick).toBe(3)
    expect(sim.time).toBeCloseTo(3 / TICK_RATE, 10)
  })

  it('advance() runs a whole number of fixed steps', () => {
    const sim = new Simulation(2)
    sim.advance(1)
    expect(sim.tick).toBe(TICK_RATE)
    expect(sim.time).toBeCloseTo(1, 10)
  })

  it('keeps identical state for identical seeds', () => {
    const a = new Simulation(42)
    const b = new Simulation(42)
    for (let i = 0; i < 100; i++) a.step()
    for (let i = 0; i < 100; i++) b.step()
    expect(JSON.stringify(a.world)).toBe(JSON.stringify(b.world))
  })

  it('diverges for different seeds', () => {
    const a = new Simulation(1)
    const b = new Simulation(2)
    for (let i = 0; i < 50; i++) a.step()
    for (let i = 0; i < 50; i++) b.step()
    const different =
      JSON.stringify(a.world.creatures.map((c) => c.x)) !==
      JSON.stringify(b.world.creatures.map((c) => c.x))
    expect(different).toBe(true)
  })

  it('spawns its initial population inside the arena', () => {
    const sim = new Simulation(3)
    expect(sim.world.width).toBe(WORLD_WIDTH)
    expect(sim.world.height).toBe(WORLD_HEIGHT)
    expect(sim.world.creatures).toHaveLength(INITIAL_CREATURE_COUNT)
  })
})
