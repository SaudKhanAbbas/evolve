import { describe, expect, it } from 'vitest'
import { FOOD_CAPACITY } from './config'
import { metabolicCostPerSec, plantDigestionEfficiency } from './energy'
import { Simulation } from './simulation'

describe('lifecycle', () => {
  it('drains creature energy through metabolism every tick', () => {
    const sim = new Simulation(100)
    const creature = sim.world.creatures[0]
    const before = creature.energy
    sim.step()
    const expectedDrain = (metabolicCostPerSec(creature) * 1) / 30
    expect(before - creature.energy).toBeCloseTo(expectedDrain, 6)
    sim.advance(2)
    expect(creature.energy).toBeLessThan(before)
    expect(creature.alive).toBe(true)
  })

  it('ages creatures over time', () => {
    const sim = new Simulation(101)
    const creature = sim.world.creatures[0]
    sim.advance(5)
    expect(creature.age).toBeCloseTo(5, 6)
  })

  it('starves creatures when no food exists', () => {
    const sim = new Simulation(102)
    sim.world.food.length = 0
    const initialPopulation = sim.world.creatures.length
    sim.advance(90)
    expect(sim.world.creatures.length).toBeLessThan(initialPopulation)
    for (const c of sim.world.creatures) {
      expect(c.alive).toBe(true)
      expect(c.energy).toBeGreaterThan(0)
    }
  })

  it('lets a creature eat adjacent food and gain energy', () => {
    const sim = new Simulation(103)
    const creature = sim.world.creatures[0]
    creature.energy = 10
    const capacity = 80 * creature.genome.size
    const food = { id: 999999, x: creature.x + 1, y: creature.y, value: 30 }
    sim.world.food = [food]
    sim.step()
    expect(sim.world.food.some((f) => f.id === 999999)).toBe(false)
    expect(creature.energy).toBeGreaterThan(10 - 0.5)
    expect(creature.energy).toBeLessThanOrEqual(capacity)
  })

  it('caps energy gain at the creature capacity', () => {
    const sim = new Simulation(104)
    const creature = sim.world.creatures[0]
    const capacity = 80 * creature.genome.size
    creature.energy = capacity - 5
    const food = { id: 999998, x: creature.x, y: creature.y, value: 30 }
    sim.world.food = [food]
    sim.step()
    expect(creature.energy).toBeCloseTo(capacity, 6)
  })

  it('removes dead creatures from the world', () => {
    const sim = new Simulation(105)
    const doomed = sim.world.creatures[0]
    doomed.energy = 0.01
    sim.world.food.length = 0
    sim.world.creatures = [doomed]
    sim.step()
    expect(sim.world.creatures).toHaveLength(0)
  })

  it('regrows food toward carrying capacity without exceeding it', () => {
    const sim = new Simulation(106)
    sim.world.food.length = 0
    sim.world.foodDebt = 0
    sim.advance(20)
    expect(sim.world.food.length).toBeGreaterThan(0)
    expect(sim.world.food.length).toBeLessThanOrEqual(FOOD_CAPACITY)
    sim.advance(600)
    expect(sim.world.food.length).toBe(FOOD_CAPACITY)
  })

  it('digests plants more efficiently for herbivorous diets', () => {
    expect(plantDigestionEfficiency(-1)).toBe(1)
    expect(plantDigestionEfficiency(0)).toBe(1)
    expect(plantDigestionEfficiency(1)).toBe(0.25)
  })
})
