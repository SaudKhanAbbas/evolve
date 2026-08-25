export interface SpatialHashOptions {
  worldWidth: number
  worldHeight: number
  cellSize: number
}

export class SpatialHash<T> {
  private readonly cellSize: number
  private readonly cols: number
  private readonly rows: number
  private readonly cells: Array<Array<SpatialEntry<T>>>

  constructor(options: SpatialHashOptions) {
    this.cellSize = options.cellSize
    this.cols = Math.ceil(options.worldWidth / options.cellSize)
    this.rows = Math.ceil(options.worldHeight / options.cellSize)
    this.cells = new Array(this.cols * this.rows)
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i] = []
    }
  }

  clear(): void {
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i].length = 0
    }
  }

  insert(x: number, y: number, item: T): void {
    const idx = this.indexFor(x, y)
    if (idx !== -1) {
      this.cells[idx].push({ x, y, item })
    }
  }

  queryInto(x: number, y: number, radius: number, out: T[]): T[] {
    out.length = 0
    const minCx = Math.max(0, Math.floor((x - radius) / this.cellSize))
    const maxCx = Math.min(this.cols - 1, Math.floor((x + radius) / this.cellSize))
    const minCy = Math.max(0, Math.floor((y - radius) / this.cellSize))
    const maxCy = Math.min(this.rows - 1, Math.floor((y + radius) / this.cellSize))
    const rSq = radius * radius

    for (let cy = minCy; cy <= maxCy; cy++) {
      const rowShift = cy * this.cols
      for (let cx = minCx; cx <= maxCx; cx++) {
        const bucket = this.cells[rowShift + cx]
        for (let i = 0; i < bucket.length; i++) {
          const e = bucket[i]
          const dx = e.x - x
          const dy = e.y - y
          if (dx * dx + dy * dy <= rSq) {
            out.push(e.item)
          }
        }
      }
    }
    return out
  }

  private indexFor(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.cols * this.cellSize || y >= this.rows * this.cellSize) {
      return -1
    }
    return Math.floor(y / this.cellSize) * this.cols + Math.floor(x / this.cellSize)
  }
}

export interface SpatialEntry<T> {
  x: number
  y: number
  item: T
}
