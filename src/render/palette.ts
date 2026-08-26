interface PaletteSegment {
  until: number
  from: number
  to: number
}

// Perceptually weighted allocation of gene space: greens/teals/cyans/blues get
// the majority share, violet/magenta is compressed, and the rarest slice maps
// to warm coral/amber/gold accents. Diet shifts herbivore-leaning creatures
// toward green and carnivore-leaning ones toward magenta.
const SEGMENTS: PaletteSegment[] = [
  { until: 0.52, from: 105, to: 178 },
  { until: 0.78, from: 178, to: 220 },
  { until: 0.93, from: 220, to: 292 },
]
const WARM_FROM = 18
const WARM_TO = 52
const DIET_SHIFT = 25

export function paletteHue(geneHue: number, diet: number): number {
  const pos = (((geneHue % 360) + 360) % 360) / 360
  let hue: number
  if (pos >= 0.93) {
    hue = WARM_FROM + ((pos - 0.93) / 0.07) * (WARM_TO - WARM_FROM)
  } else {
    const segment = SEGMENTS.find((s) => pos < s.until) ?? SEGMENTS[SEGMENTS.length - 1]
    const prevUntil = SEGMENTS[SEGMENTS.indexOf(segment) - 1]?.until ?? 0
    const t = (pos - prevUntil) / (segment.until - prevUntil)
    hue = segment.from + t * (segment.to - segment.from)
  }
  return hue + diet * DIET_SHIFT
}
