import { describe, expect, it } from 'vitest'

import { deepFreeze } from './deepFreeze.js'

describe('deepFreeze', () => {
  it('should freeze and return the object and every nested object and array', () => {
    const value = { group: { tags: [{ name: 'a' }] } }

    expect(deepFreeze(value)).toBe(value)
    expect([value, value.group, value.group.tags, value.group.tags[0]].every(Object.isFrozen)).toBe(
      true,
    )
  })

  it('should skip typed arrays such as a Buffer, which cannot be frozen', () => {
    expect(Object.isFrozen(deepFreeze({ data: Buffer.from('abc') }))).toBe(true)
  })

  it.for([null, 'text'])('should return %s unchanged', (value) => {
    expect(deepFreeze(value)).toBe(value)
  })
})
