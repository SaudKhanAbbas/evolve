import type { Simulation } from '../sim/simulation'
import { Sparkline } from '../render/sparkline'
import type { Playback } from './controls'

const SAMPLE_INTERVAL_SEC = 1

export class Hud {
  private readonly root: HTMLElement
  private readonly popSpark: Sparkline
  private readonly speedSpark: Sparkline
  private lastSampleTime = -1

  constructor(root: HTMLElement, popCanvas: HTMLCanvasElement, speedCanvas: HTMLCanvasElement) {
    this.root = root
    this.popSpark = new Sparkline(popCanvas, 168)
    this.speedSpark = new Sparkline(speedCanvas, 265)
  }

  maybeSample(sim: Simulation): void {
    if (sim.time - this.lastSampleTime >= SAMPLE_INTERVAL_SEC) {
      this.lastSampleTime = sim.time
      const creatures = sim.world.creatures
      this.popSpark.push(creatures.length)
      if (creatures.length > 0) {
        const avgSpeed = creatures.reduce((sum, c) => sum + c.genome.maxSpeed, 0) / creatures.length
        this.speedSpark.push(avgSpeed)
      } else {
        this.speedSpark.push(0)
      }
    }
  }

  render(sim: Simulation, playback: Playback): void {
    const creatures = sim.world.creatures
    const maxGen = creatures.reduce((m, c) => Math.max(m, c.generation), 0)
    this.root.textContent =
      `POPULATION  ${String(creatures.length).padStart(4)}\n` +
      `GENERATION  ${String(maxGen).padStart(4)}\n` +
      `TIME        ${sim.time.toFixed(1)}s\n` +
      `SPEED       ${playback.speed}x${playback.paused ? ' (PAUSED)' : ''}\n` +
      `SEED        ${sim.seed}`
    this.popSpark.draw()
    this.speedSpark.draw()
  }
}
