import { FlattenedField, PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { getImportFieldFunctions } from './getImportFieldFunctions.js'

const mockReq = {
  payload: {
    logger: {
      error: vi.fn(),
    },
  },
} as unknown as PayloadRequest

const callHook = (
  hooks: ReturnType<typeof getImportFieldFunctions>,
  key: string,
  value: unknown,
) => {
  const entry = hooks[key]
  if (!entry || entry.type !== 'beforeImport') {
    throw new Error(`Expected beforeImport hook for ${key}`)
  }
  return entry.fn({
    columnName: key,
    data: {},
    format: 'csv',
    operation: 'create',
    req: mockReq,
    siblingData: {},
    siblingDoc: {},
    value,
  })
}

describe('getImportFieldFunctions empty-cell guards', () => {
  describe('checkbox', () => {
    const fields: FlattenedField[] = [{ name: 'flag', type: 'checkbox' } as FlattenedField]

    it('should return undefined for empty string instead of false', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook(hooks, 'flag', '')).toBeUndefined()
    })

    it('should return undefined for null', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook(hooks, 'flag', null)).toBeUndefined()
    })

    it('should return undefined for undefined', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook(hooks, 'flag', undefined)).toBeUndefined()
    })

    it('should still parse "true" as true', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook(hooks, 'flag', 'true')).toBe(true)
    })

    it('should still parse "false" as false', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook(hooks, 'flag', 'false')).toBe(false)
    })

    it('should still pass through real booleans', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook(hooks, 'flag', true)).toBe(true)
      expect(callHook(hooks, 'flag', false)).toBe(false)
    })
  })

  describe('number (without hasMany)', () => {
    const fields: FlattenedField[] = [{ name: 'count', type: 'number' } as FlattenedField]

    it('should return undefined for empty string instead of 0', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook(hooks, 'count', '')).toBeUndefined()
    })

    it('should return undefined for null', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook(hooks, 'count', null)).toBeUndefined()
    })

    it('should return undefined for undefined', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook(hooks, 'count', undefined)).toBeUndefined()
    })

    it('should still parse a numeric string', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook(hooks, 'count', '42')).toBe(42)
    })

    it('should still pass through a real number', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook(hooks, 'count', 7)).toBe(7)
    })
  })

  describe('date', () => {
    const fields: FlattenedField[] = [{ name: 'when', type: 'date' } as FlattenedField]

    it('should return undefined for empty string', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook(hooks, 'when', '')).toBeUndefined()
    })

    it('should return undefined for null', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook(hooks, 'when', null)).toBeUndefined()
    })

    it('should still parse a valid ISO date', () => {
      const hooks = getImportFieldFunctions({ fields })
      const iso = '2026-05-06T00:00:00.000Z'
      expect(callHook(hooks, 'when', iso)).toBe(iso)
    })
  })

  describe('json', () => {
    const fields: FlattenedField[] = [{ name: 'meta', type: 'json' } as FlattenedField]

    it('should return undefined for empty string', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook(hooks, 'meta', '')).toBeUndefined()
    })

    it('should return undefined for null', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook(hooks, 'meta', null)).toBeUndefined()
    })

    it('should still parse a valid JSON string', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook(hooks, 'meta', '{"a":1}')).toEqual({ a: 1 })
    })
  })
})
