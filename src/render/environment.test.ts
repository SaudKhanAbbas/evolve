import { describe, expect, it } from 'vitest'
import { Environment } from './environment'
import { WORLD_HEIGHT, WORLD_WIDTH } from '../sim/config'

const PAD = 320

describe('Environment', () => {
  it('spawns a deterministic snow field', () => {
    const a = new Environment()
    const b = new Environment()
    expect(a.flakeCount).toBe(b.flakeCount)
    expect(a.flakeCount).toBeGreaterThan(100)
    expect(a.flakeAt(0)).toEqual(b.flakeAt(0))
  })

  it('keeps every flake inside the padded world region across long updates', () => {
    const env = new Environment()
    env.update(1 / 60)
    for (let second = 0; second < 600; second++) {
      env.update(1)
      for (let i = 0; i < env.flakeCount; i++) {
        const f = env.flakeAt(i)
        expect(f.x).toBeGreaterThanOrEqual(-PAD - 1e-6)
        expect(f.x).toBeLessThanOrEqual(WORLD_WIDTH + PAD + 1e-6)
        expect(f.y).toBeGreaterThanOrEqual(-PAD - 1e-6)
        expect(f.y).toBeLessThanOrEqual(WORLD_HEIGHT + PAD + 1e-6)
      }
    }
  })

  it('gives flakes two distinct parallax depth bands', () => {
    const env = new Environment()
    let deep = 0
    let near = 0
    for (let i = 0; i < env.flakeCount; i++) {
      if (env.flakeAt(i).depth < 0.5) deep++
      else near++
    }
    expect(deep).toBeGreaterThan(20)
    expect(near).toBeGreaterThan(20)
  })

  it('ignores non-positive update deltas', () => {
    const before = new Environment()
    const after = new Environment()
    after.update(0)
    after.update(-1)
    expect(after.flakeAt(5)).toEqual(before.flakeAt(5))
  })
})
