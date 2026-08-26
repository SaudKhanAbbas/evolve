const WARM_CUTOFF = 0.94
const COOL_START = 148
const COOL_SPAN = 174
const WARM_START = 14
const WARM_SPAN = 44
const DIET_SHIFT = 16

export function paletteHue(geneHue: number, diet: number): number {
  const pos = (((geneHue % 360) + 360) % 360) / 360
  let hue: number
  if (pos >= WARM_CUTOFF) {
    hue = WARM_START + ((pos - WARM_CUTOFF) / (1 - WARM_CUTOFF)) * WARM_SPAN
  } else {
    hue = COOL_START + (pos / WARM_CUTOFF) * COOL_SPAN
  }
  return hue + diet * DIET_SHIFT
}
