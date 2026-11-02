import { describe, expect, it } from 'vitest'

import { unflatten } from './unflatten.js'

describe('unflatten', () => {
  it('should handle constrained object paths', () => {
    const marker = 'constrainedUnflattenMarker'
    const originalDescriptor = Object.getOwnPropertyDescriptor(Object.prototype, marker)
    const target = JSON.parse(
      `{"__proto__.${marker}":"value","constructor.value":"local","prototype.value":"local","profile.displayName":"Ada"}`,
    ) as Record<string, unknown>
    let result: Record<string, unknown> | undefined
    let processStateChanged = false

    try {
      result = unflatten(target)
      processStateChanged = Object.hasOwn(Object.prototype, marker)
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(Object.prototype, marker, originalDescriptor)
      } else {
        delete (Object.prototype as Record<string, unknown>)[marker]
      }
    }

    expect(processStateChanged).toBe(false)
    expect(Object.getOwnPropertyDescriptor(Object.prototype, marker)).toEqual(originalDescriptor)
    expect(result).toEqual({
      constructor: { value: 'local' },
      profile: {
        displayName: 'Ada',
      },
      prototype: { value: 'local' },
    })
    expect(Object.hasOwn(result as object, 'constructor')).toBe(true)
    expect(Object.hasOwn(result as object, 'prototype')).toBe(true)
  })
})
