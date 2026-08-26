import { describe, expect, it } from 'vitest'
import { paletteHue } from './palette'

function bucket(hue: number): number {
  return Math.floor((((hue % 360) + 360) % 360) / 30)
}

describe('paletteHue', () => {
  it('spreads cool genes across emerald, teal, blue, indigo, violet, and magenta', () => {
    const seen = new Set<number>()
    for (let h = 0; h < 340; h += 4) {
      const hue = paletteHue(h, 0)
      expect(hue).toBeGreaterThanOrEqual(146)
      expect(hue).toBeLessThanOrEqual(324)
      seen.add(bucket(hue))
    }
    expect(seen.size).toBeGreaterThanOrEqual(5)
  })

  it('reserves warm coral/amber/gold hues for the rarest gene slice', () => {
    for (let h = 0; h < 338; h += 2) {
      const hue = paletteHue(h, 0)
      const norm = ((hue % 360) + 360) % 360
      expect(norm).toBeGreaterThan(100)
    }
    const rare = paletteHue(350, 0)
    const rareNorm = ((rare % 360) + 360) % 360
    expect(rareNorm).toBeGreaterThanOrEqual(12)
    expect(rareNorm).toBeLessThanOrEqual(60)
  })

  it('keeps the rare warm slice under eight percent of gene space', () => {
    let warm = 0
    const samples = 10000
    for (let i = 0; i < samples; i++) {
      const hue = paletteHue((i / samples) * 360, 0)
      const norm = ((hue % 360) + 360) % 360
      if (norm < 90) warm++
    }
    expect(warm / samples).toBeLessThan(0.08)
    expect(warm / samples).toBeGreaterThan(0.03)
  })

  it('uses diet to shift hue without collapsing diversity', () => {
    expect(paletteHue(200, 1)).toBeGreaterThan(paletteHue(200, 0))
    expect(paletteHue(200, 0)).toBeGreaterThan(paletteHue(200, -1))
    const herbivoreSpread = paletteHue(300, -1) - paletteHue(10, -1)
    expect(Math.abs(herbivoreSpread)).toBeGreaterThan(60)
  })

  it('produces a visually mixed population, not a monoculture', () => {
    const counts = new Map<number, number>()
    for (let i = 0; i < 2000; i++) {
      const hue = paletteHue((i / 2000) * 360, ((i % 7) / 7) * 2 - 1)
      const b = bucket(hue)
      counts.set(b, (counts.get(b) ?? 0) + 1)
    }
    const total = [...counts.values()].reduce((a, b) => a + b, 0)
    const largest = Math.max(...counts.values())
    expect(counts.size).toBeGreaterThanOrEqual(6)
    expect(largest / total).toBeLessThan(0.45)
  })

  it('is deterministic', () => {
    expect(paletteHue(123.4, -0.3)).toBe(paletteHue(123.4, -0.3))
  })
})
