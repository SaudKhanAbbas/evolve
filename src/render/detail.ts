export type DetailTier = 'distant' | 'low' | 'medium' | 'high'

const BASE_THRESHOLDS = { distant: 2.2, low: 4.6, medium: 9 }

export function detailTier(screenRadius: number, quality: number): DetailTier {
  const m = 1 + (1 - Math.min(Math.max(quality, 0), 1)) * 1.6
  if (screenRadius < BASE_THRESHOLDS.distant * m) return 'distant'
  if (screenRadius < BASE_THRESHOLDS.low * m) return 'low'
  if (screenRadius < BASE_THRESHOLDS.medium * m) return 'medium'
  return 'high'
}

const FRAME_BUDGET_MS = 13
const DOWNGRADE_MS = 1.6
const UPGRADE_MS = 2.5
const DOWNGRADE_STEP = 0.2

export class QualityController {
  private emaMs = FRAME_BUDGET_MS
  private level = 1
  private overTime = 0
  private underTime = 0

  update(frameMs: number, dt: number): void {
    if (!Number.isFinite(frameMs) || dt <= 0) return
    this.emaMs += (frameMs - this.emaMs) * Math.min(1, dt * 4)

    if (this.emaMs > FRAME_BUDGET_MS * 1.25) {
      this.overTime += dt
      this.underTime = 0
    } else if (this.emaMs < FRAME_BUDGET_MS * 0.65) {
      this.underTime += dt
      this.overTime = 0
    } else {
      this.overTime = Math.max(0, this.overTime - dt)
      this.underTime = Math.max(0, this.underTime - dt)
    }

    if (this.overTime >= DOWNGRADE_MS) {
      this.level = Math.max(0, this.level - DOWNGRADE_STEP)
      this.overTime = 0
    }
    if (this.underTime >= UPGRADE_MS) {
      this.level = Math.min(1, this.level + 0.1)
      this.underTime = 0
    }
  }

  get quality(): number {
    return this.level
  }

  get smoothedFrameMs(): number {
    return this.emaMs
  }
}
