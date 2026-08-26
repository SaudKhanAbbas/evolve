import { describe, expect, it } from 'vitest'
import { config } from './config'

describe('palette configuration', () => {
  it('defines no centralized ambient light source', () => {
    expect(config.palette).not.toHaveProperty('glow')
    const keys = Object.keys(config.palette)
    expect(keys).toEqual(['abyssTop', 'abyssBottom'])
  })
})
