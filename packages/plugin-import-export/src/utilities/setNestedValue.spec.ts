import { APIError } from 'payload'
import { describe, expect, it } from 'vitest'

import { setNestedValue } from './setNestedValue.js'

const unsupportedSegments = ['__proto__']
const unsupportedPaths = unsupportedSegments.flatMap((segment) => [
  `${segment}.value`,
  `group.${segment}.value`,
  `group.${segment}`,
  `items.${segment}.0.value`,
  `items.0.${segment}.value`,
  `items.0.${segment}`,
])

describe('setNestedValue', () => {
  it.each(unsupportedPaths)('rejects invalid field path %s without changing the target', (path) => {
    const target = { stable: { value: true } }
    const objectPrototypeBefore = Object.getOwnPropertyDescriptors(Object.prototype)
    const targetPrototypeBefore = Object.getPrototypeOf(target)

    try {
      setNestedValue(target, path, true)
      expect.fail('Expected setNestedValue to reject the invalid field path')
    } catch (error) {
      expect(error).toBeInstanceOf(APIError)

      if (error instanceof APIError) {
        expect(error.status).toBe(400)
        expect(error.isPublic).toBe(true)
      }
    }

    expect(target).toEqual({ stable: { value: true } })
    expect(Object.getPrototypeOf(target)).toBe(targetPrototypeBefore)
    expect(Object.getOwnPropertyDescriptors(Object.prototype)).toEqual(objectPrototypeBefore)
  })

  it('should build nested values from owned data', () => {
    const inheritedContainer = 'constrainedNestedContainer'
    const target: Record<string, unknown> = {}
    const source: Record<string, unknown> = {}
    const objectPrototypeBefore = Object.getOwnPropertyDescriptors(Object.prototype)
    const originalContainerDescriptor = Object.getOwnPropertyDescriptor(
      Object.prototype,
      inheritedContainer,
    )
    let inheritedGetterCalls = 0
    let inheritedSetterCalls = 0

    try {
      Object.defineProperty(Object.prototype, inheritedContainer, {
        configurable: true,
        get: () => {
          inheritedGetterCalls += 1
          return { value: 'inherited' }
        },
        set: () => {
          inheritedSetterCalls += 1
        },
      })

      setNestedValue(target, 'constructor.prototype.value', 'example')
      setNestedValue(target, 'prototype.value', 'example')
      setNestedValue(target, `${inheritedContainer}.value`, 'local', source)
    } finally {
      if (originalContainerDescriptor) {
        Object.defineProperty(Object.prototype, inheritedContainer, originalContainerDescriptor)
      } else {
        delete (Object.prototype as Record<string, unknown>)[inheritedContainer]
      }
    }

    expect(inheritedGetterCalls).toBe(0)
    expect(inheritedSetterCalls).toBe(0)
    expect(Object.hasOwn(target, 'constructor')).toBe(true)
    expect(Object.hasOwn(target, 'prototype')).toBe(true)
    expect(target).toEqual({
      [inheritedContainer]: {
        value: 'local',
      },
      constructor: {
        prototype: {
          value: 'example',
        },
      },
      prototype: {
        value: 'example',
      },
    })
    expect(Object.getPrototypeOf(target.constructor)).toBeNull()
    expect(Object.getPrototypeOf(target.prototype)).toBeNull()
    expect(Object.getOwnPropertyDescriptors(Object.prototype)).toEqual(objectPrototypeBefore)
  })

  it('rejects field paths with out-of-range array indexes', () => {
    const source = { items: [{ value: true }] }
    const target: Record<string, unknown> = {}

    expect(() => setNestedValue(target, 'items.4294967294.value', true, source)).toThrow(APIError)
    expect(target).toEqual({ items: [] })
  })

  it('supports out-of-order array indexes that exist in the source document', () => {
    const source = { items: [{ value: 'first' }, { value: 'second' }, { value: 'third' }] }
    const target: Record<string, unknown> = {}

    setNestedValue(target, 'items.2.value', 'third', source)

    expect(target).toEqual({ items: [undefined, undefined, { value: 'third' }] })
  })

  it.each(['-1', '+1', '01', ' 1', '1 ', '1e2', '0x10', 'Infinity', '9007199254740992'])(
    'treats noncanonical numeric segment %s as an object key',
    (segment) => {
      const target: Record<string, unknown> = {}

      setNestedValue(target, `items.${segment}.value`, 'example')

      expect(Array.isArray(target.items)).toBe(false)
      expect(target).toEqual({ items: { [segment]: { value: 'example' } } })
    },
  )

  it('builds nested objects and arrays', () => {
    const target: Record<string, unknown> = {}

    setNestedValue(target, 'group.items.0.title', 'first')
    setNestedValue(target, 'group.items.0.description', 'description')
    setNestedValue(target, 'group.items.1.title', 'second')

    expect(target).toEqual({
      group: {
        items: [{ description: 'description', title: 'first' }, { title: 'second' }],
      },
    })

    const group = target.group as Record<string, unknown>
    const items = group.items as Record<string, unknown>[]

    expect(Object.getPrototypeOf(group)).toBeNull()
    expect(Array.isArray(items)).toBe(true)
    expect(Object.getPrototypeOf(items[0])).toBeNull()
    expect(Object.getPrototypeOf(items[1])).toBeNull()
  })

  it('supports nested arrays using numeric lookahead', () => {
    const target: Record<string, unknown> = {}

    setNestedValue(target, 'matrix.0.1.value', 'nested')

    expect(target).toEqual({
      matrix: [[undefined, { value: 'nested' }]],
    })
  })

  it('creates own containers instead of traversing inherited properties', () => {
    const inheritedGroup = { inherited: true }
    const target = Object.create({ group: inheritedGroup }) as Record<string, unknown>

    setNestedValue(target, 'group.value', 'own')

    expect(Object.prototype.hasOwnProperty.call(target, 'group')).toBe(true)
    expect(target.group).toEqual({ value: 'own' })
    expect(Object.getPrototypeOf(target.group)).toBeNull()
    expect(inheritedGroup).toEqual({ inherited: true })
  })
})
