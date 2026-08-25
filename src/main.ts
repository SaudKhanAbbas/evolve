import './style.css'
import { TICK_RATE } from './sim/config'
import { Simulation } from './sim/simulation'
import { Renderer } from './render/renderer'

function seedFromUrl(): number {
  const raw = Number(new URLSearchParams(window.location.search).get('seed'))
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 42
}

const canvas = document.querySelector<HTMLCanvasElement>('#app')
if (!canvas) {
  throw new Error('EVOLVE: #app canvas element not found')
}
const hud = document.querySelector<HTMLDivElement>('#hud')

const simulation = new Simulation(seedFromUrl())
const renderer = new Renderer(canvas)

window.addEventListener('resize', () => renderer.resize())

const STEP = 1 / TICK_RATE
let last = performance.now()
let accumulator = 0
let framesUntilHud = 0

function frame(now: number): void {
  const elapsed = Math.min((now - last) / 1000, 0.1)
  last = now
  accumulator += elapsed

  while (accumulator >= STEP) {
    simulation.step()
    accumulator -= STEP
  }

  renderer.draw(simulation)

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
