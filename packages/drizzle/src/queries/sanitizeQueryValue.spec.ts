import type { Field } from 'payload'

import { describe, expect, it } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { UnmatchableValue } from '../utilities/unmatchableValue.js'
import { sanitizeQueryValue } from './sanitizeQueryValue.js'

const uuid = '3f2504e0-4f89-11d3-9a0c-0305e82c3301'

const sanitizeUUID = (operator: string, val: unknown) =>
  sanitizeQueryValue({
    adapter: { idType: 'uuid' } as unknown as DrizzleAdapter,
    field: { name: 'id', type: 'text' } as unknown as Field,
    isUUID: true,
    operator,
    relationOrPath: 'id',
    val,
  })

const sanitizeNumber = (operator: string, val: unknown) =>
  sanitizeQueryValue({
    adapter: { idType: 'serial' } as unknown as DrizzleAdapter,
    field: { name: 'age', type: 'number' } as unknown as Field,
    isUUID: false,
    operator,
    relationOrPath: 'age',
    val,
  })

describe('sanitizeQueryValue', () => {
  describe('an operand that cannot be cast to a uuid column', () => {
    it('reports it as unmatchable rather than coercing it to null', () => {
      expect(sanitizeUUID('equals', 'not-a-uuid').value).toBe(UnmatchableValue)
    })

    it('reports it for not_equals too', () => {
      expect(sanitizeUUID('not_equals', 'not-a-uuid').value).toBe(UnmatchableValue)
    })

    it('preserves the operator so the caller can negate the clause', () => {
      expect(sanitizeUUID('not_equals', 'not-a-uuid').operator).toStrictEqual('not_equals')
    })

    it('still reads "null" as the null check', () => {
      expect(sanitizeUUID('equals', 'null').value).toBeNull()
    })

    it('still reads an empty string as the null check', () => {
      expect(sanitizeUUID('equals', '').value).toBeNull()
    })

    it('leaves a valid uuid untouched', () => {
      expect(sanitizeUUID('equals', uuid).value).toStrictEqual(uuid)
    })

    it('leaves other operators coercing to null, preserving their existing failure modes', () => {
      expect(sanitizeUUID('greater_than', 'not-a-uuid').value).toBeNull()
      // `contains` then wraps that null for a LIKE - odd, but what it did before this change,
      // and what keeps Postgres' own "cannot ILIKE a uuid" error the reported failure.
      expect(sanitizeUUID('contains', 'not-a-uuid').value).toStrictEqual('%null%')
    })
  })

  describe('an operand that cannot be cast to a number column', () => {
    it('reports it as unmatchable rather than coercing it to null', () => {
      expect(sanitizeNumber('equals', 'abc').value).toBe(UnmatchableValue)
    })

    it('still reads "null" as the null check', () => {
      expect(sanitizeNumber('equals', 'null').value).toBeNull()
    })

    it('leaves a numeric string untouched', () => {
      expect(sanitizeNumber('equals', '5').value).toStrictEqual(5)
    })

    it('leaves other operators coercing to null, preserving their existing failure modes', () => {
      expect(sanitizeNumber('greater_than', 'abc').value).toBeNull()
    })
  })
})
