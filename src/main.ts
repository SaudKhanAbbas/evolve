import './style.css'
import { TICK_RATE } from './sim/config'
import { Simulation } from './sim/simulation'
import { Renderer } from './render/renderer'
import { Camera } from './render/camera'
import { EffectSystem } from './render/effects'
import { attachInput } from './ui/input'
import { createControls } from './ui/controls'
import type { Playback } from './ui/controls'
import { selection } from './ui/selection'
import { Inspector } from './ui/inspector'
import { Hud } from './ui/hud'
import { clamp } from './utils/math'

function seedFromUrl(): number {
  const raw = Number(new URLSearchParams(window.location.search).get('seed'))
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 42
}

const canvas = document.querySelector<HTMLCanvasElement>('#app')
if (!canvas) {
  throw new Error('EVOLVE: #app canvas element not found')
}
const hudText = document.querySelector<HTMLDivElement>('#hud')
const popCanvas = document.querySelector<HTMLCanvasElement>('#chart-pop')
const speedCanvas = document.querySelector<HTMLCanvasElement>('#chart-speed')

const effects = new EffectSystem()
const simulation = new Simulation(seedFromUrl(), true, (e) => effects.handleEvent(e))
const renderer = new Renderer(canvas)
const camera = new Camera()

let hud: Hud | null = null
if (hudText && popCanvas && speedCanvas) {
  hud = new Hud(hudText, popCanvas, speedCanvas)
}

const inspectorRoot = document.querySelector<HTMLElement>('#inspector')
if (!inspectorRoot) {
  throw new Error('EVOLVE: #inspector element not found')
}
const inspector = new Inspector(inspectorRoot)

attachInput(canvas, camera, {
  onSelect: (worldX, worldY) => {
    let best: (typeof simulation.world.creatures)[number] | null = null
    let bestDistSq = Number.POSITIVE_INFINITY
    for (const creature of simulation.world.creatures) {
      const dx = creature.x - worldX
      const dy = creature.y - worldY
      const pickRadius = 3 + creature.genome.size * 2.5 + 8
      const d = dx * dx + dy * dy
      if (d <= pickRadius * pickRadius && d < bestDistSq) {
        bestDistSq = d
        best = creature
      }
    }
    selection.creatureId = best ? best.id : null
    if (!best) inspector.hide()
  },
})

const controlsRoot = document.querySelector<HTMLDivElement>('#controls')
if (!controlsRoot) {
  throw new Error('EVOLVE: #controls element not found')
}
const playback: Playback = { paused: false, speed: 1 }
createControls(controlsRoot, playback)

window.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.code === 'Escape') {
    selection.creatureId = null
    inspector.hide()
  }
})

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
  const interpAlpha = clamp(accumulator / STEP, 0, 1)

  renderer.draw(simulation, camera, effects, selection.creatureId, interpAlpha)

  if (hud) {
    hud.maybeSample(simulation)
    if (++framesUntilHud >= 10) {
      framesUntilHud = 0
      hud.render(simulation, playback)

      if (selection.creatureId != null) {
        const selected = simulation.world.creatures.find((c) => c.id === selection.creatureId)
        if (selected) {
          inspector.show(selected)
        } else {
          selection.creatureId = null
          inspector.hide()
        }
      }
    }
  }

  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)
