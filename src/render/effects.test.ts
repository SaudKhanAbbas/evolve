import { describe, expect, it } from 'vitest'
import { EffectSystem } from './effects'
import type { SimEvent } from '../sim/events'

function event(type: SimEvent['type']): SimEvent {
  return { type, x: 100, y: 100, hue: 200, size: 1 }
}

describe('EffectSystem', () => {
  it('accumulates spawned effects', () => {
    const fx = new EffectSystem()
    fx.handleEvent(event('birth'))
    fx.handleEvent(event('death'))
    expect(fx.count).toBe(2)
  })

  it('expires effects after their lifetime', () => {
    const fx = new EffectSystem()
    fx.handleEvent(event('birth'))
    fx.update(0.35)
    expect(fx.count).toBe(1)
    fx.update(0.4)
    expect(fx.count).toBe(0)
  })

  it('keeps longer-lived effects while shorter ones expire', () => {
    const fx = new EffectSystem()
    fx.handleEvent(event('birth'))
    fx.handleEvent(event('death'))
    fx.update(0.8)
    expect(fx.count).toBe(1)
    fx.update(0.5)
    expect(fx.count).toBe(0)
  })

  it('caps the number of live effects', () => {
    const fx = new EffectSystem()
    for (let i = 0; i < 500; i++) {
      fx.handleEvent(event('birth'))
    }
    expect(fx.count).toBeLessThanOrEqual(300)
  })
})
