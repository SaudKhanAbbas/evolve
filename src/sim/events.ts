export type SimEventType = 'birth' | 'death'

export interface SimEvent {
  type: SimEventType
  x: number
  y: number
  hue: number
  size: number
}

export type SimObserver = (event: SimEvent) => void
