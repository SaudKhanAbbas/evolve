import { describe, expect, it } from 'vitest'
import { paletteHue } from './palette'

describe('paletteHue', () => {
  it('keeps herbivore-leaning creatures in the cyan/teal/blue band', () => {
    for (let h = 0; h < 360; h += 7) {
      const hue = paletteHue(h, -1)
      expect(hue).toBeGreaterThanOrEqual(171)
      expect(hue).toBeLessThanOrEqual(225)
    }
  })

  it('keeps omnivore creatures in the blue/indigo band', () => {
    for (let h = 0; h < 360; h += 7) {
      const hue = paletteHue(h, 0)
      expect(hue).toBeGreaterThanOrEqual(210)
      expect(hue).toBeLessThanOrEqual(264)
    }
  })

  it('keeps carnivore-leaning creatures in the violet/magenta band', () => {
    for (let h = 0; h < 360; h += 7) {
      const hue = paletteHue(h, 1)
      expect(hue).toBeGreaterThanOrEqual(249)
      expect(hue).toBeLessThanOrEqual(303)
    }
  })

  it('never leaves the curated bioluminescent range for any genome', () => {
    for (let h = 0; h < 720; h += 13) {
      for (let d = -1; d <= 1; d += 0.05) {
        const hue = paletteHue(h, d)
        expect(hue).toBeGreaterThanOrEqual(170)
        expect(hue).toBeLessThanOrEqual(305)
        expect(Number.isFinite(hue)).toBe(true)
      }
    }
  })

  it('still lets the hue gene visibly differentiate organisms', () => {
    const spread = paletteHue(10, -0.5) - paletteHue(350, -0.5)
    expect(Math.abs(spread)).toBeGreaterThan(30)
  })

  it('shifts the band warmer/violet as diet becomes carnivorous', () => {
    expect(paletteHue(180, 1)).toBeGreaterThan(paletteHue(180, 0))
    expect(paletteHue(180, 0)).toBeGreaterThan(paletteHue(180, -1))
  })
})
