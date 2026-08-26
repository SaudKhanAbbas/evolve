export type SimEventType = 'birth' | 'death' | 'eat'

export interface SimEvent {
  type: SimEventType
  x: number
  y: number
  hue: number
  diet: number
  size: number
}

export type SimObserver = (event: SimEvent) => void
