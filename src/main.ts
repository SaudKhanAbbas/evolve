import './style.css'
import { TICK_RATE } from './sim/config'
import { Simulation } from './sim/simulation'
import { Renderer } from './render/renderer'
import { Camera } from './render/camera'
import { EffectSystem } from './render/effects'
import { attachInput } from './ui/input'
import { createControls } from './ui/controls'
import type { Playback } from './ui/controls'

function seedFromUrl(): number {
  const raw = Number(new URLSearchParams(window.location.search).get('seed'))
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 42
}

const canvas = document.querySelector<HTMLCanvasElement>('#app')
if (!canvas) {
  throw new Error('EVOLVE: #app canvas element not found')
}
const hud = document.querySelector<HTMLDivElement>('#hud')

const effects = new EffectSystem()
const simulation = new Simulation(seedFromUrl(), true, (e) => effects.handleEvent(e))
const renderer = new Renderer(canvas)
const camera = new Camera()

attachInput(canvas, camera, {})

const controlsRoot = document.querySelector<HTMLDivElement>('#controls')
if (!controlsRoot) {
  throw new Error('EVOLVE: #controls element not found')
}
const playback: Playback = { paused: false, speed: 1 }
createControls(controlsRoot, playback)

window.addEventListener('resize', () => renderer.resize())

const STEP = 1 / TICK_RATE
const MAX_STEPS_PER_FRAME = 600
let last = performance.now()
let accumulator = 0
let framesUntilHud = 0

function frame(now: number): void {
  const elapsed = Math.min((now - last) / 1000, 0.1)
  last = now
  if (!playback.paused) {
    accumulator += elapsed * playback.speed
  }
  effects.update(elapsed)

  let steps = 0
  while (accumulator >= STEP && steps < MAX_STEPS_PER_FRAME) {
    simulation.step()
    accumulator -= STEP
    steps++
  }
  if (steps === MAX_STEPS_PER_FRAME) {
    accumulator = 0
  }

  renderer.draw(simulation, camera, effects)

  if (hud && ++framesUntilHud >= 10) {
    framesUntilHud = 0
    const creatures = simulation.world.creatures
    const maxGen = creatures.reduce((m, c) => Math.max(m, c.generation), 0)
    hud.textContent =
      `POPULATION  ${String(creatures.length).padStart(4)}\n` +
      `GENERATION  ${String(maxGen).padStart(4)}\n` +
      `TIME        ${simulation.time.toFixed(1)}s\n` +
      `SEED        ${simulation.seed}`
  }

  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)
