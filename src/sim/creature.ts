import type { Genome } from './genome'

export interface Creature {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  heading: number
  energy: number
  age: number
  generation: number
  offspringCount: number
  reproductionCooldown: number
  alive: boolean
  genome: Genome
}

export function creatureRadius(size: number): number {
  return 3 + size * 2.5
}

export function createCreature(
  id: number,
  x: number,
  y: number,
  heading: number,
  energy: number,
  generation: number,
  genome: Genome,
): Creature {
  return {
    id,
    x,
    y,
    vx: 0,
    vy: 0,
    heading,
    energy,
    age: 0,
    generation,
    offspringCount: 0,
    reproductionCooldown: 0,
    alive: true,
    genome,
  }
}
