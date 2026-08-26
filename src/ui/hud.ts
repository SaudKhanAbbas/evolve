import type { Simulation } from '../sim/simulation'
import { Sparkline } from '../render/sparkline'
import type { Playback } from './controls'

const SAMPLE_INTERVAL_SEC = 1

interface StatRefs {
  population: HTMLElement | null
  generation: HTMLElement | null
  time: HTMLElement | null
  speed: HTMLElement | null
  seed: HTMLElement | null
}

export class Hud {
  private readonly popSpark: Sparkline
  private readonly speedSpark: Sparkline
  private readonly stats: StatRefs
  private readonly statusDot: HTMLElement | null
  private readonly statusText: HTMLElement | null
  private readonly popValue: HTMLElement | null
  private readonly speedValue: HTMLElement | null
  private lastSampleTime = -1

  constructor(root: HTMLElement, popCanvas: HTMLCanvasElement, speedCanvas: HTMLCanvasElement) {
    this.stats = {
      population: root.querySelector('[data-stat="population"]'),
      generation: root.querySelector('[data-stat="generation"]'),
      time: root.querySelector('[data-stat="time"]'),
      speed: root.querySelector('[data-stat="speed"]'),
      seed: root.querySelector('[data-stat="seed"]'),
    }
    this.statusDot = document.getElementById('status-dot')
    this.statusText = document.getElementById('status-text')
    this.popValue = document.getElementById('chart-pop-value')
    this.speedValue = document.getElementById('chart-speed-value')
    this.popSpark = new Sparkline(popCanvas, 168)
    this.speedSpark = new Sparkline(speedCanvas, 265)
  }

  maybeSample(sim: Simulation): void {
    if (sim.time - this.lastSampleTime >= SAMPLE_INTERVAL_SEC) {
      this.lastSampleTime = sim.time
      const creatures = sim.world.creatures
      this.popSpark.push(creatures.length)
      let avgSpeed = 0
      if (creatures.length > 0) {
        avgSpeed = creatures.reduce((sum, c) => sum + c.genome.maxSpeed, 0) / creatures.length
      }
      this.speedSpark.push(avgSpeed)
      if (this.popValue) this.popValue.textContent = String(creatures.length)
      if (this.speedValue) this.speedValue.textContent = avgSpeed.toFixed(2)
    }
  }

  render(sim: Simulation, playback: Playback): void {
    const creatures = sim.world.creatures
    const maxGen = creatures.reduce((m, c) => Math.max(m, c.generation), 0)
    this.setStat(this.stats.population, String(creatures.length))
    this.setStat(this.stats.generation, String(maxGen))
    this.setStat(this.stats.time, `${sim.time.toFixed(0)} s`)
    this.setStat(this.stats.speed, playback.paused ? 'PAUSED' : `${playback.speed}×`)
    this.setStat(this.stats.seed, String(sim.seed))

    if (this.statusDot && this.statusText) {
      this.statusDot.classList.toggle('paused', playback.paused)
      this.statusText.textContent = playback.paused ? 'PAUSED' : 'LIVE'
    }

    this.popSpark.draw()
    this.speedSpark.draw()
  }

  private setStat(el: HTMLElement | null, value: string): void {
    if (el) el.textContent = value
  }
}
