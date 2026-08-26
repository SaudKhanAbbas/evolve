export class Series {
  readonly values: number[] = []
  readonly capacity: number

  constructor(capacity: number) {
    this.capacity = capacity
  }

  push(value: number): void {
    if (!Number.isFinite(value)) return
    if (this.values.length >= this.capacity) {
      this.values.shift()
    }
    this.values.push(value)
  }

  get length(): number {
    return this.values.length
  }

  last(): number | null {
    return this.values.length > 0 ? this.values[this.values.length - 1] : null
  }

  range(): { min: number; max: number } | null {
    if (this.values.length === 0) return null
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY
    for (const v of this.values) {
      if (v < min) min = v
      if (v > max) max = v
    }
    return { min, max }
  }

  paddedRange(): { min: number; max: number } | null {
    const r = this.range()
    if (!r) return null
    if (r.min === r.max) {
      return { min: r.min - 1, max: r.max + 1 }
    }
    const pad = (r.max - r.min) * 0.12
    return { min: r.min - pad, max: r.max + pad }
  }
}
