import { describe, expect, it } from 'vitest'
import { paletteHue } from './palette'

function norm(hue: number): number {
  return ((hue % 360) + 360) % 360
}

function bucket(hue: number): number {
  return Math.floor(norm(hue) / 30)
}

describe('paletteHue', () => {
  it('allocates most gene space to green, teal, and cyan', () => {
    let greenTealCyan = 0
    const samples = 1000
    for (let i = 0; i < samples; i++) {
      const hue = norm(paletteHue((i / samples) * 360, 0))
      if (hue >= 95 && hue < 185) greenTealCyan++
    }
    expect(greenTealCyan / samples).toBeGreaterThan(0.45)
    expect(greenTealCyan / samples).toBeLessThan(0.6)
  })

  it('keeps blue strongly represented', () => {
    let blue = 0
    const samples = 1000
    for (let i = 0; i < samples; i++) {
      const hue = norm(paletteHue((i / samples) * 360, 0))
      if (hue >= 185 && hue < 260) blue++
    }
    expect(blue / samples).toBeGreaterThan(0.2)
    expect(blue / samples).toBeLessThan(0.35)
  })

  it('compresses violet/purple/magenta into a minority slice', () => {
    let violetMagenta = 0
    const samples = 1000
    for (let i = 0; i < samples; i++) {
      const hue = norm(paletteHue((i / samples) * 360, 0))
      if (hue >= 260 && hue < 330) violetMagenta++
    }
    expect(violetMagenta / samples).toBeGreaterThan(0.05)
    expect(violetMagenta / samples).toBeLessThan(0.2)
  })

  it('keeps warm coral/amber/gold as rare accents', () => {
    let warm = 0
    const samples = 10000
    for (let i = 0; i < samples; i++) {
      const hue = norm(paletteHue((i / samples) * 360, 0))
      if (hue < 90) warm++
    }
    expect(warm / samples).toBeGreaterThan(0.03)
    expect(warm / samples).toBeLessThan(0.08)
  })

  it('covers every major intended region across gene space', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 2000; i++) {
      const hue = norm(paletteHue((i / 2000) * 360, ((i % 5) / 5) * 2 - 1))
      seen.add(bucket(hue))
    }
    for (const expected of [2, 5, 6, 7, 8, 9]) {
      expect(seen.has(expected)).toBe(true)
    }
    expect(seen.size).toBeGreaterThanOrEqual(8)
  })

  it('shifts herbivore-leaning creatures toward green and carnivores toward magenta', () => {
    const gene = 220
    const herbivore = norm(paletteHue(gene, -1))
    const carnivore = norm(paletteHue(gene, 1))
    expect(herbivore).toBeLessThan(norm(paletteHue(gene, 0)))
    expect(norm(paletteHue(gene, 0))).toBeLessThan(carnivore)
    expect(herbivore).toBeLessThan(200)
  })

  it('produces a mixed field where no single bucket dominates', () => {
    const counts = new Map<number, number>()
    for (let i = 0; i < 4000; i++) {
      const hue = paletteHue((i / 4000) * 360, ((i % 9) / 9) * 2 - 1)
      const b = bucket(hue)
      counts.set(b, (counts.get(b) ?? 0) + 1)
    }
    const total = [...counts.values()].reduce((a, b) => a + b, 0)
    const largest = Math.max(...counts.values())
    expect(counts.size).toBeGreaterThanOrEqual(7)
    expect(largest / total).toBeLessThan(0.35)
  })

  it('is deterministic for identical inputs', () => {
    expect(paletteHue(217.8, -0.42)).toBe(paletteHue(217.8, -0.42))
  })
})
