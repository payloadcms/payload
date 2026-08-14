import { APIError } from 'payload'
import { describe, expect, it } from 'vitest'

import { getSelect } from './getSelect.js'

const unsupportedSegments = ['__proto__', 'constructor', 'prototype']

describe('getSelect', () => {
  it.each(
    unsupportedSegments.flatMap((segment) => [
      [`${segment}.field`, segment, 'root'],
      [`group.${segment}.field`, segment, 'middle'],
      [`group.${segment}`, segment, 'leaf'],
    ]),
  )('rejects invalid field path %s', (path) => {
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
  })

  it('leaves global object state unchanged when rejecting invalid paths', () => {
    expect(Object.prototype).not.toHaveProperty('syntheticMarker')

    for (const path of ['__proto__.syntheticMarker', 'constructor.prototype.syntheticMarker']) {
      expect(() => getSelect([path])).toThrow(APIError)
    }

    expect(Object.prototype).not.toHaveProperty('syntheticMarker')
  })

  it('builds select objects and merges nested siblings', () => {
    const select = getSelect(['id', 'group.title', 'group.description'])

    expect(select).toEqual({
      group: {
        description: true,
        title: true,
      },
      id: true,
    })
    expect(Object.getPrototypeOf(select)).toBeNull()
    expect(Object.getPrototypeOf(select.group)).toBeNull()
  })
})
