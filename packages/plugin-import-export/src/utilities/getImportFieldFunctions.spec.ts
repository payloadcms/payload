import type { FlattenedField, PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { getImportFieldFunctions } from './getImportFieldFunctions.js'

const mockReq = {
  payload: {
    logger: {
      error: vi.fn(),
    },
  },
} as unknown as PayloadRequest

const callHook = ({
  format = 'csv',
  hooks,
  key,
  value,
}: {
  format?: 'csv' | 'json'
  hooks: ReturnType<typeof getImportFieldFunctions>
  key: string
  value: unknown
}) => {
  const entry = hooks[key]
  if (!entry || entry.type !== 'beforeImport') {
    throw new Error(`Expected beforeImport hook for ${key}`)
  }
  return entry.fn({
    columnName: key,
    data: {},
    format,
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
      expect(callHook({ hooks, key: 'flag', value: '' })).toBeUndefined()
    })

    it('should return undefined for null', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook({ hooks, key: 'flag', value: null })).toBeUndefined()
    })

    it('should return undefined for undefined', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook({ hooks, key: 'flag', value: undefined })).toBeUndefined()
    })

    it('should still parse "true" as true', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook({ hooks, key: 'flag', value: 'true' })).toBe(true)
    })

    it('should still parse "false" as false', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook({ hooks, key: 'flag', value: 'false' })).toBe(false)
    })

    it('should still pass through real booleans', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook({ hooks, key: 'flag', value: true })).toBe(true)
      expect(callHook({ hooks, key: 'flag', value: false })).toBe(false)
    })
  })

  describe('number (without hasMany)', () => {
    const fields: FlattenedField[] = [{ name: 'count', type: 'number' } as FlattenedField]

    it('should return undefined for empty string instead of 0', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook({ hooks, key: 'count', value: '' })).toBeUndefined()
    })

    it('should return undefined for null', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook({ hooks, key: 'count', value: null })).toBeUndefined()
    })

    it('should return undefined for undefined', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook({ hooks, key: 'count', value: undefined })).toBeUndefined()
    })

    it('should still parse a numeric string', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook({ hooks, key: 'count', value: '42' })).toBe(42)
    })

    it('should still pass through a real number', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook({ hooks, key: 'count', value: 7 })).toBe(7)
    })
  })

  describe('date', () => {
    const fields: FlattenedField[] = [{ name: 'when', type: 'date' } as FlattenedField]

    it('should return undefined for empty string', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook({ hooks, key: 'when', value: '' })).toBeUndefined()
    })

    it('should return undefined for null', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook({ hooks, key: 'when', value: null })).toBeUndefined()
    })

    it('should still parse a valid ISO date', () => {
      const hooks = getImportFieldFunctions({ fields })
      const iso = '2026-05-06T00:00:00.000Z'
      expect(callHook({ hooks, key: 'when', value: iso })).toBe(iso)
    })
  })

  describe('json', () => {
    const fields: FlattenedField[] = [{ name: 'meta', type: 'json' } as FlattenedField]

    it('should return undefined for empty string', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook({ hooks, key: 'meta', value: '' })).toBeUndefined()
    })

    it('should return undefined for null', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook({ hooks, key: 'meta', value: null })).toBeUndefined()
    })

    it('should still parse a valid JSON string', () => {
      const hooks = getImportFieldFunctions({ fields })
      expect(callHook({ hooks, key: 'meta', value: '{"a":1}' })).toEqual({ a: 1 })
    })
  })

  describe('hasMany relationships', () => {
    it('should remove null entries from a monomorphic JSON relationship array', () => {
      const fields: FlattenedField[] = [
        {
          name: 'rels',
          type: 'relationship',
          hasMany: true,
          relationTo: 'posts',
        } as FlattenedField,
      ]
      const hooks = getImportFieldFunctions({ fields })

      expect(callHook({ format: 'json', hooks, key: 'rels', value: [null, 'p1'] })).toEqual(['p1'])
    })

    it('should remove null entries from a polymorphic JSON relationship array', () => {
      const fields: FlattenedField[] = [
        {
          name: 'rels',
          type: 'relationship',
          hasMany: true,
          relationTo: ['posts', 'users'],
        } as FlattenedField,
      ]
      const hooks = getImportFieldFunctions({ fields })
      const surviving = { relationTo: 'posts', value: 'p1' }

      expect(callHook({ format: 'json', hooks, key: 'rels', value: [null, surviving] })).toEqual([
        surviving,
      ])
    })

    it('should leave non-array JSON relationship values unchanged', () => {
      const fields: FlattenedField[] = [
        {
          name: 'rels',
          type: 'relationship',
          hasMany: true,
          relationTo: 'posts',
        } as FlattenedField,
      ]
      const hooks = getImportFieldFunctions({ fields })

      expect(callHook({ format: 'json', hooks, key: 'rels', value: 'p1' })).toBe('p1')
    })

    it('should leave complete JSON relationship arrays unchanged', () => {
      const fields: FlattenedField[] = [
        {
          name: 'rels',
          type: 'relationship',
          hasMany: true,
          relationTo: 'posts',
        } as FlattenedField,
      ]
      const hooks = getImportFieldFunctions({ fields })

      expect(callHook({ format: 'json', hooks, key: 'rels', value: ['p1', 'p2'] })).toEqual([
        'p1',
        'p2',
      ])
    })
  })
})
