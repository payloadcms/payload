import type { Field } from 'payload'

import { describe, expect, it } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { sanitizeQueryValue } from './sanitizeQueryValue.js'

/**
 * `getTableColumnFromPath` synthesizes these two shapes for the `id` path - a number field
 * on every non-UUID adapter, a text field on a UUID one - so they are what an `id` query is
 * actually sanitized against.
 */
const numericIDField = { name: 'id', type: 'number' } as unknown as Field
const uuidIDField = { name: 'id', type: 'text' } as unknown as Field

const uuid = '3f2504e0-4f89-11d3-9a0c-0305e82c3301'

const sanitize = (operator: string, val: unknown) =>
  sanitizeQueryValue({
    adapter: { idType: 'serial' } as unknown as DrizzleAdapter,
    field: numericIDField,
    isUUID: false,
    operator,
    relationOrPath: 'id',
    val,
  })

const sanitizeUUID = (operator: string, val: unknown) =>
  sanitizeQueryValue({
    adapter: { idType: 'uuid' } as unknown as DrizzleAdapter,
    field: uuidIDField,
    isUUID: true,
    operator,
    relationOrPath: 'id',
    val,
  })

describe('sanitizeQueryValue', () => {
  describe('in / not_in operands on a numeric column', () => {
    it('drops an empty operand from a not_in list', () => {
      expect(sanitize('not_in', ['']).value).toEqual([])
    })

    it('drops an empty operand from an in list', () => {
      expect(sanitize('in', ['']).value).toEqual([])
    })

    it('keeps the numeric operands alongside a dropped empty one', () => {
      expect(sanitize('not_in', ['', '5']).value).toEqual([5])
    })

    it('coerces an array of numeric strings to numbers', () => {
      expect(sanitize('in', ['5', '6']).value).toEqual([5, 6])
    })

    it('coerces a comma-delineated string, dropping its blank entries', () => {
      expect(sanitize('not_in', '5,,6').value).toEqual([5, 6])
    })

    it('drops an operand that is not numeric at all', () => {
      expect(sanitize('in', ['5', 'abc']).value).toEqual([5])
    })
  })

  describe('in / not_in operands on a uuid column', () => {
    it('drops an empty operand from a not_in list', () => {
      expect(sanitizeUUID('not_in', ['']).value).toEqual([])
    })

    it('keeps a valid uuid alongside a dropped empty one', () => {
      expect(sanitizeUUID('not_in', ['', uuid]).value).toEqual([uuid])
    })

    it('drops an operand that is not a valid uuid', () => {
      expect(sanitizeUUID('in', [uuid, 'not-a-uuid']).value).toEqual([uuid])
    })
  })
})
