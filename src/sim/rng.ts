import { TAU } from '../utils/math'

export class Rng {
  private state: number

  constructor(seed: number) {
    this.state = seed >>> 0
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  int(minInclusive: number, maxExclusive: number): number {
    return Math.floor(this.range(minInclusive, maxExclusive))
  }

  angle(): number {
    return this.next() * TAU
  }

  gauss(mean = 0, stdDev = 1): number {
    const u1 = Math.max(this.next(), Number.EPSILON)
    const u2 = this.next()
    const magnitude = stdDev * Math.sqrt(-2 * Math.log(u1))
    return mean + magnitude * Math.cos(TAU * u2)
  }
}
