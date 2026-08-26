import { describe, expect, it } from 'vitest'
import { createCanvas, Path2D } from '@napi-rs/canvas'
import { createCreature } from './creature'
import { createRandomGenome } from './genome'
import { drawOrganism } from '../render/creatureArtist'
import type { Creature } from './creature'
import type { DetailTier } from '../render/detail'

const BENCH = process.env.EVOLVE_BENCH === '1'

if (BENCH && typeof (globalThis as Record<string, unknown>).document === 'undefined') {
  ;(globalThis as Record<string, unknown>).document = {
    createElement: (): HTMLCanvasElement => createCanvas(128, 128) as unknown as HTMLCanvasElement,
  }
  ;(globalThis as Record<string, unknown>).window = { devicePixelRatio: 1 }
  ;(globalThis as Record<string, unknown>).Path2D = Path2D
}

function makePopulation(count: number): Creature[] {
  let seed = 12345
  const next = (): number => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  const rng = { next, range: (min: number, max: number): number => min + next() * (max - min) }
  const creatures: Creature[] = []
  for (let i = 0; i < count; i++) {
    const c = createCreature(
      i + 1,
      (i * 977) % 1600,
      (i * 613) % 1200,
      (i % 12) * 0.52,
      60,
      3,
      createRandomGenome(rng),
    )
    c.vx = Math.cos(c.heading) * 40
    c.vy = Math.sin(c.heading) * 40
    creatures.push(c)
  }
  return creatures
}

describe.skipIf(!BENCH)('tier isolation benchmark', () => {
  it('measures each tier in isolation at 1200 creatures', { timeout: 180_000 }, () => {
    const log: string[] = []
    const canvas = createCanvas(1280, 800)
    const ctx = canvas.getContext('2d')
    const creatures = makePopulation(1200)

    for (const tier of ['distant', 'low', 'medium', 'high'] as DetailTier[]) {
      drawOrganism(ctx, creatures[0], 1, tier)
      const start = performance.now()
      const frames = 50
      for (let f = 0; f < frames; f++) {
        const t = f / 60
        ctx.fillStyle = 'rgba(2, 6, 14, 0.3)'
        ctx.fillRect(0, 0, 1280, 800)
        for (const c of creatures) {
          drawOrganism(ctx, c, t, tier)
        }
      }
      log.push(
        `[tier-bench] ${tier} @1200: ${((performance.now() - start) / frames).toFixed(2)} ms/frame`,
      )
    }
    void import('node:fs').then((fs) =>
      fs.appendFileSync(process.env.EVOLVE_BENCH_OUT ?? 'tier-bench.txt', log.join('\n') + '\n'),
    )
    expect(creatures.length).toBe(1200)
  })
})
