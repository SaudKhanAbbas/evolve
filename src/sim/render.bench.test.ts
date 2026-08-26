import { describe, expect, it } from 'vitest'
import { createCanvas, Path2D } from '@napi-rs/canvas'
import { createCreature } from './creature'
import { createRandomGenome } from './genome'
import { drawOrganism } from '../render/creatureArtist'
import { Environment } from '../render/environment'
import { Camera } from '../render/camera'
import { EffectSystem } from '../render/effects'
import { detailTier } from '../render/detail'
import { drawBloom } from '../render/bloom'
import { paletteHue } from '../render/palette'
import type { Creature } from './creature'

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

function benchDraw(
  label: string,
  count: number,
  mode: 'high' | 'auto-fit',
  frames: number,
  log: string[],
): void {
  const canvas = createCanvas(1280, 800)
  const ctx = canvas.getContext('2d')
  const glow = createCanvas(1280, 800)
  const glowCtx = glow.getContext('2d')
  const creatures = makePopulation(count)
  const camera = new Camera()
  const environment = new Environment()
  const effects = new EffectSystem()
  const viewScale = mode === 'high' ? 4 : 0.55

  drawOrganism(ctx, creatures[0], 1, 'high')
  environment.drawVignette(ctx, 1280, 800)

  const start = performance.now()
  for (let f = 0; f < frames; f++) {
    const t = f / 60
    ctx.fillStyle = 'rgba(2, 6, 14, 0.3)'
    ctx.fillRect(0, 0, 1280, 800)

    glowCtx.clearRect(0, 0, 1280, 800)
    ctx.save()
    camera.applyTransform(ctx, 1280, 800)
    environment.drawBack(ctx, camera, t)
    for (const c of creatures) {
      const tier = mode === 'high' ? 'high' : detailTier(c.genome.size * 2.5 * viewScale, 1)
      const hue = paletteHue(c.genome.hue, c.genome.diet)
      drawBloom(glowCtx, hue, c.x, c.y, Math.max(c.genome.size * 2.5, 3) * 2.2, 0.9)
      drawOrganism(ctx, c, t, tier)
    }
    effects.draw(ctx)
    ctx.restore()
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.drawImage(glow, 0, 0, 1280, 800)
    ctx.restore()
    environment.drawVignette(ctx, 1280, 800)
  }
  const perFrame = (performance.now() - start) / frames
  log.push(`[render-bench] ${label}: ${perFrame.toFixed(2)} ms/frame`)
  expect(perFrame).toBeGreaterThan(0)
}

describe.skipIf(!BENCH)('render benchmark', () => {
  it('measures full-detail organism rendering', { timeout: 180_000 }, () => {
    const log: string[] = []
    for (const pop of [300, 600, 900, 1200]) {
      benchDraw(`HIGH detail pop=${pop}`, pop, 4, 60, log)
    }
    flushLog(log)
  })

  it('measures fit-zoom organism rendering', { timeout: 180_000 }, () => {
    const log: string[] = []
    for (const pop of [300, 600, 900, 1200]) {
      benchDraw(`fit zoom pop=${pop}`, pop, 0.55, 60, log)
    }
    flushLog(log)
  })

  it('measures environment-only cost', { timeout: 60_000 }, () => {
    const log: string[] = []
    const canvas = createCanvas(1280, 800)
    const ctx = canvas.getContext('2d')
    const camera = new Camera()
    const environment = new Environment()
    environment.drawVignette(ctx, 1280, 800)
    const start = performance.now()
    const frames = 300
    for (let f = 0; f < frames; f++) {
      const t = f / 60
      ctx.save()
      camera.applyTransform(ctx, 1280, 800)
      environment.drawBack(ctx, camera, t)
      ctx.restore()
      environment.drawVignette(ctx, 1280, 800)
    }
    log.push(
      `[render-bench] environment+vignette: ${((performance.now() - start) / frames).toFixed(2)} ms/frame`,
    )
    flushLog(log)
    expect(true).toBe(true)
  })
})

function flushLog(log: string[]): void {
  void import('node:fs').then((fs) =>
    fs.appendFileSync(process.env.EVOLVE_BENCH_OUT ?? 'render-bench.txt', log.join('\n') + '\n'),
  )
}
