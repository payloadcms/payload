import { describe, expect, it } from 'vitest'

import { getObjectDotNotation } from './getObjectDotNotation.js'

describe('getObjectDotNotation', () => {
  it('should read only owned object paths', () => {
    let inheritedGetterCalls = 0
    const inheritedRoot = Object.create({
      get nested() {
        inheritedGetterCalls += 1
        return { value: 'inherited' }
      },
    }) as Record<string, unknown>
    const inheritedLeaf = {
      nested: Object.create({
        get value() {
          inheritedGetterCalls += 1
          return 'inherited'
        },
      }),
    }

    expect(getObjectDotNotation(inheritedRoot, 'nested.value', 'fallback')).toBe('fallback')
    expect(getObjectDotNotation(inheritedLeaf, 'nested.value', 'fallback')).toBe('fallback')
    expect(getObjectDotNotation({ nested: { value: 'owned' } }, 'nested.value', 'fallback')).toBe(
      'owned',
    )
    expect(inheritedGetterCalls).toBe(0)
  })
})
