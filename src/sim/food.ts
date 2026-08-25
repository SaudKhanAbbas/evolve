export interface Food {
  id: number
  x: number
  y: number
  value: number
}

export const FOOD_RADIUS = 2.5

export function createFood(id: number, x: number, y: number, value: number): Food {
  return { id, x, y, value }
}
