export interface InputActions {
  onSelect?: (worldX: number, worldY: number) => void
}

const DRAG_THRESHOLD_PX = 4

interface LocalPoint {
  x: number
  y: number
  vw: number
  vh: number
}

export function attachInput(
  canvas: HTMLCanvasElement,
  camera: {
    panBy(dxWorld: number, dyWorld: number, vw: number, vh: number): void
    zoomAt(sx: number, sy: number, factor: number, vw: number, vh: number): void
    screenToWorld(sx: number, sy: number, vw: number, vh: number): { x: number; y: number }
    scale(vw: number, vh: number): number
  },
  actions: InputActions,
): () => void {
  let dragging = false
  let pointerDown = false
  let lastX = 0
  let lastY = 0

  function toLocal(event: PointerEvent | WheelEvent): LocalPoint {
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      vw: canvas.clientWidth,
      vh: canvas.clientHeight,
    }
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return
    const p = toLocal(event)
    pointerDown = true
    dragging = false
    lastX = p.x
    lastY = p.y
    canvas.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent): void {
    if (!pointerDown) return
    const p = toLocal(event)
    const dx = p.x - lastX
    const dy = p.y - lastY
    if (!dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) dragging = true
    if (dragging) {
      const s = camera.scale(p.vw, p.vh)
      camera.panBy(-dx / s, -dy / s, p.vw, p.vh)
    }
    lastX = p.x
    lastY = p.y
  }

  function onPointerUp(event: PointerEvent): void {
    if (!pointerDown) return
    pointerDown = false
    canvas.releasePointerCapture(event.pointerId)
    if (!dragging && actions.onSelect) {
      const p = toLocal(event)
      const world = camera.screenToWorld(p.x, p.y, p.vw, p.vh)
      actions.onSelect(world.x, world.y)
    }
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault()
    const p = toLocal(event)
    const factor = Math.exp(-event.deltaY * 0.0015)
    camera.zoomAt(p.x, p.y, factor, p.vw, p.vh)
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('wheel', onWheel, { passive: false })

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('wheel', onWheel)
  }
}
