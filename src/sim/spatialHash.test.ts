import { describe, expect, it } from 'vitest'
import { SpatialHash } from './spatialHash'
import type { Food } from './food'
import { Rng } from './rng'
import { distSq } from '../utils/math'

function makeFood(id: number, x: number, y: number): Food {
  return { id, x, y, value: 30 }
}

describe('SpatialHash', () => {
  it('finds items within the query radius and excludes those outside', () => {
    const hash = new SpatialHash<Food>({ worldWidth: 1000, worldHeight: 1000, cellSize: 64 })
    hash.insert(500, 500, makeFood(1, 500, 500))
    hash.insert(560, 500, makeFood(2, 560, 500))
    hash.insert(700, 700, makeFood(3, 700, 700))

    const result = hash.queryInto(505, 500, 60, [])
    const ids = new Set(result.map((f) => f.id))
    expect(ids.has(1)).toBe(true)
    expect(ids.has(2)).toBe(true)
    expect(ids.has(3)).toBe(false)
  })

  it('includes items exactly on the radius boundary', () => {
    const hash = new SpatialHash<Food>({ worldWidth: 1000, worldHeight: 1000, cellSize: 64 })
    hash.insert(550, 500, makeFood(1, 550, 500))
    const result = hash.queryInto(500, 500, 50, [])
    expect(result).toHaveLength(1)
  })

  it('clears between rebuilds', () => {
    const hash = new SpatialHash<Food>({ worldWidth: 1000, worldHeight: 1000, cellSize: 64 })
    hash.insert(500, 500, makeFood(1, 500, 500))
    hash.clear()
    expect(hash.queryInto(500, 500, 100, [])).toHaveLength(0)
    hash.insert(502, 500, makeFood(2, 502, 500))
    expect(hash.queryInto(500, 500, 100, []).map((f) => f.id)).toEqual([2])
  })

  it('matches brute-force search across a random field', () => {
    const rng = new Rng(4242)
    const width = 1600
    const height = 1200
    const hash = new SpatialHash<Food>({ worldWidth: width, worldHeight: height, cellSize: 64 })
    const foods: Food[] = []
    for (let i = 0; i < 2000; i++) {
      const f = makeFood(i, rng.range(0, width), rng.range(0, height))
      foods.push(f)
      hash.insert(f.x, f.y, f)
    }

    for (let q = 0; q < 300; q++) {
      const qx = rng.range(0, width)
      const qy = rng.range(0, height)
      const radius = rng.range(10, 250)
      const expected = foods
        .filter((f) => distSq(qx, qy, f.x, f.y) <= radius * radius)
        .map((f) => f.id)
        .sort((a, b) => a - b)
      const actual = hash
        .queryInto(qx, qy, radius, [])
        .map((f) => f.id)
        .sort((a, b) => a - b)
      expect(actual).toEqual(expected)
    }
  })

  it('returns results in deterministic order', () => {
    const hash = new SpatialHash<Food>({ worldWidth: 1000, worldHeight: 1000, cellSize: 64 })
    const ids: number[] = []
    for (let i = 0; i < 50; i++) {
      const id = i + 1
      hash.insert(
        400 + (i % 7),
        400 + Math.floor(i / 7),
        makeFood(id, 400 + (i % 7), 400 + Math.floor(i / 7)),
      )
      ids.push(id)
    }
    const firstPass = hash.queryInto(403, 403, 20, []).map((f) => f.id)
    const secondPass = hash.queryInto(403, 403, 20, []).map((f) => f.id)
    expect(firstPass).toEqual(secondPass)
    expect(new Set(firstPass).size).toBe(firstPass.length)
  })
})
