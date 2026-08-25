export const TICK_RATE = 30
export const TICK_DURATION = 1 / TICK_RATE

export const WORLD_WIDTH = 1600
export const WORLD_HEIGHT = 1200

export const INITIAL_CREATURE_COUNT = 140
export const INITIAL_FOOD_COUNT = 400

export const MAX_CREATURES = 900
export const FOOD_CAPACITY = 600

export const MUTATION = {
  chance: 0.12,
  strength: 0.06,
} as const

export const SPEED_SCALE = 45

export const ENERGY = {
  perSize: 80,
  startFraction: 0.7,
  metabolicRate: 1.4,
  moveCost: 0.0009,
  plantValue: 30,
  reproductionThreshold: 0.75,
  birthCost: 10,
  childShare: 0.5,
  cooldownTicks: 90,
} as const

export const REGEN_RATE_PER_SEC = 60
