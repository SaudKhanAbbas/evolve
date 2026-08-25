import './style.css'
import { Renderer } from './render/renderer'

const canvas = document.querySelector<HTMLCanvasElement>('#app')
if (!canvas) {
  throw new Error('EVOLVE: #app canvas element not found')
}

const renderer = new Renderer(canvas)

window.addEventListener('resize', () => renderer.resize())

function frame(): void {
  renderer.draw()
  requestAnimationFrame(frame)
}

renderer.resize()
requestAnimationFrame(frame)
