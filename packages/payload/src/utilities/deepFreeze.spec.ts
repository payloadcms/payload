import { describe, expect, it } from 'vitest'

import { deepFreeze } from './deepFreeze.js'

describe('deepFreeze', () => {
  it('should freeze and return the object and every nested object and array', () => {
    const value = { group: { tags: [{ name: 'a' }] } }

    expect(deepFreeze(value)).toBe(value)
    expect(Object.isFrozen(value)).toBe(true)
    expect(Object.isFrozen(value.group)).toBe(true)
    expect(Object.isFrozen(value.group.tags)).toBe(true)
    expect(Object.isFrozen(value.group.tags[0])).toBe(true)
  })

  it('should skip typed arrays such as a Buffer, which cannot be frozen', () => {
    const value = { data: Buffer.from('abc') }

    expect(() => deepFreeze(value)).not.toThrow()
    expect(Object.isFrozen(value)).toBe(true)
  })

  it('should return primitives and null unchanged', () => {
    expect(deepFreeze(null)).toBeNull()
    expect(deepFreeze('text')).toBe('text')
  })
})
