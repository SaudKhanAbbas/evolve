import { clamp, lerp } from '../utils/math'

const HUE_FLOOR = 172
const HUE_BAND_SHIFT = 78
const HUE_SPAN = 52

export function paletteHue(geneHue: number, diet: number): number {
  const genePos = (((geneHue % 360) + 360) % 360) / 360
  const dietNorm = clamp((diet + 1) / 2, 0, 1)
  const bandStart = lerp(HUE_FLOOR, HUE_FLOOR + HUE_BAND_SHIFT, dietNorm)
  return bandStart + genePos * HUE_SPAN
}
