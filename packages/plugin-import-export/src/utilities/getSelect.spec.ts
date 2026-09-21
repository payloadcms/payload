import { APIError } from 'payload'
import { describe, expect, it } from 'vitest'

import { getSelect } from './getSelect.js'

describe('getSelect', () => {
  it.each(['__proto__.field', 'group.__proto__.field', 'group.__proto__'])(
    'should reject invalid field path %s',
    (path) => {
      const objectPrototypeBefore = Object.getOwnPropertyDescriptors(Object.prototype)

      try {
        getSelect([path])
        expect.fail('Expected getSelect to reject the invalid field path')
      } catch (error) {
        expect(error).toBeInstanceOf(APIError)

        if (error instanceof APIError) {
          expect(error.status).toBe(400)
          expect(error.isPublic).toBe(true)
        }
      }

      expect(Object.getOwnPropertyDescriptors(Object.prototype)).toEqual(objectPrototypeBefore)
    },
  )

  it('should build select objects with compatible field names', () => {
    const objectPrototypeBefore = Object.getOwnPropertyDescriptors(Object.prototype)
    const select = getSelect([
      'id',
      'group.title',
      'group.description',
      'constructor.prototype.value',
      'prototype.value',
    ])

    expect(Object.hasOwn(select, 'constructor')).toBe(true)
    expect(Object.hasOwn(select, 'prototype')).toBe(true)
    expect(select).toEqual({
      constructor: {
        prototype: {
          value: true,
        },
      },
      group: {
        description: true,
        title: true,
      },
      id: true,
      prototype: {
        value: true,
      },
    })
    expect(Object.getPrototypeOf(select)).toBeNull()
    expect(Object.getPrototypeOf(select.group)).toBeNull()
    expect(Object.getOwnPropertyDescriptors(Object.prototype)).toEqual(objectPrototypeBefore)
  })
})
