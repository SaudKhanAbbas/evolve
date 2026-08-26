export interface InputActions {
  onSelect?: (worldX: number, worldY: number) => void
}

const DRAG_THRESHOLD_PX = 4

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

  function viewport(): { w: number; h: number } {
    return { w: window.innerWidth, h: window.innerHeight }
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return
    pointerDown = true
    dragging = false
    lastX = event.clientX
    lastY = event.clientY
    canvas.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent): void {
    if (!pointerDown) return
    const dx = event.clientX - lastX
    const dy = event.clientY - lastY
    if (!dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) dragging = true
    if (dragging) {
      const vp = viewport()
      const s = camera.scale(vp.w, vp.h)
      camera.panBy(-dx / s, -dy / s, vp.w, vp.h)
    }
    lastX = event.clientX
    lastY = event.clientY
  }

  function onPointerUp(event: PointerEvent): void {
    if (!pointerDown) return
    pointerDown = false
    canvas.releasePointerCapture(event.pointerId)
    if (!dragging && actions.onSelect) {
      const vp = viewport()
      const world = camera.screenToWorld(event.clientX, event.clientY, vp.w, vp.h)
      actions.onSelect(world.x, world.y)
    }
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault()
    const vp = viewport()
    const factor = Math.exp(-event.deltaY * 0.0015)
    const rect = canvas.getBoundingClientRect()
    camera.zoomAt(event.clientX - rect.left, event.clientY - rect.top, factor, vp.w, vp.h)
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
