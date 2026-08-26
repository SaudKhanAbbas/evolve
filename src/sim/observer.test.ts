import { describe, expect, it } from 'vitest'
import type { SimEvent } from './events'
import { Simulation } from './simulation'

describe('simulation observer', () => {
  it('reports births during natural population growth', () => {
    const events: SimEvent[] = []
    const sim = new Simulation(7, true, (e) => events.push(e))
    sim.advance(90)
    const births = events.filter((e) => e.type === 'birth')
    expect(births.length).toBeGreaterThan(0)
    for (const e of events) {
      expect(e.x).toBeGreaterThanOrEqual(0)
      expect(e.x).toBeLessThanOrEqual(sim.world.width)
      expect(e.y).toBeGreaterThanOrEqual(0)
      expect(e.y).toBeLessThanOrEqual(sim.world.height)
      expect(Number.isFinite(e.hue)).toBe(true)
      expect(Number.isFinite(e.diet)).toBe(true)
    }
  })

  it('reports eating events while the population grazes', () => {
    const events: SimEvent[] = []
    const sim = new Simulation(21, true, (e) => events.push(e))
    sim.advance(30)
    const eats = events.filter((e) => e.type === 'eat')
    expect(eats.length).toBeGreaterThan(0)
    for (const e of eats) {
      expect(e.x).toBeGreaterThanOrEqual(0)
      expect(e.x).toBeLessThanOrEqual(sim.world.width)
      expect(Number.isFinite(e.diet)).toBe(true)
    }
  })

  it('does not alter deterministic world evolution when observed', () => {
    const silent = new Simulation(77)
    const watched = new Simulation(77, true, () => {})
    silent.advance(20)
    watched.advance(20)
    expect(JSON.stringify(watched.world)).toBe(JSON.stringify(silent.world))
  })

  it('reports deaths when food runs out', () => {
    const events: SimEvent[] = []
    const sim = new Simulation(8, false, (e) => events.push(e))
    sim.world.food.length = 0
    sim.advance(60)
    expect(events.some((e) => e.type === 'death')).toBe(true)
  })

  it('emits nothing when no observer is attached', () => {
    const sim = new Simulation(9)
    sim.advance(30)
    expect(sim.tick).toBe(900)
  })
})
