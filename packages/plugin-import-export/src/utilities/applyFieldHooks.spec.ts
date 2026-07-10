import { FlattenedField, PayloadRequest } from 'payload'

import type { ExportFieldHookEntry, ImportFieldHookEntry } from '../types.js'

import { describe, expect, it, vi } from 'vitest'

import { applyFieldHooks } from './applyFieldHooks.js'

const mockReq = {
  payload: {
    logger: {
      error: vi.fn(),
    },
  },
} as unknown as PayloadRequest

describe('applyFieldHooks parent + child traversal', () => {
  it('should run a parent group hook and still run child field hooks against the transformed value (export)', () => {
    const fields: FlattenedField[] = [
      {
        name: 'meta',
        type: 'group',
        flattenedFields: [{ name: 'slug', type: 'text' } as FlattenedField],
      } as unknown as FlattenedField,
    ]

    const fieldHooks: Record<string, ExportFieldHookEntry> = {
      meta: {
        type: 'beforeExport',
        fn: ({ value }) => {
          const obj = (value ?? {}) as Record<string, unknown>
          return { ...obj, slug: `${obj.slug ?? ''}-from-parent` }
        },
      },
      meta_slug: {
        type: 'beforeExport',
        fn: ({ value }) => `${value}-from-child`,
      },
    }

    const result = applyFieldHooks({
      type: 'beforeExport',
      data: { meta: { slug: 'raw' } },
      fieldHooks,
      fields,
      format: 'json',
      operation: 'export',
      req: mockReq,
    })

    // Parent hook ran first ('raw' → 'raw-from-parent'), then child hook ran against
    // the transformed value ('raw-from-parent' → 'raw-from-parent-from-child').
    expect(result.meta).toEqual({ slug: 'raw-from-parent-from-child' })
  })

  it('should run a parent group hook and still run child field hooks (import)', () => {
    const fields: FlattenedField[] = [
      {
        name: 'meta',
        type: 'group',
        flattenedFields: [{ name: 'slug', type: 'text' } as FlattenedField],
      } as unknown as FlattenedField,
    ]

    const fieldHooks: Record<string, ImportFieldHookEntry> = {
      meta: {
        type: 'beforeImport',
        fn: ({ value }) => {
          const obj = (value ?? {}) as Record<string, unknown>
          return { ...obj, slug: `${obj.slug ?? ''}-from-parent` }
        },
      },
      meta_slug: {
        type: 'beforeImport',
        fn: ({ value }) => `${value}-from-child`,
      },
    }

    const result = applyFieldHooks({
      type: 'beforeImport',
      data: { meta: { slug: 'raw' } },
      fieldHooks,
      fields,
      format: 'json',
      operation: 'import',
      req: mockReq,
    })

    expect(result.meta).toEqual({ slug: 'raw-from-parent-from-child' })
  })

  it('should run a parent array hook then child hooks for each item', () => {
    const fields: FlattenedField[] = [
      {
        name: 'items',
        type: 'array',
        flattenedFields: [{ name: 'note', type: 'text' } as FlattenedField],
      } as unknown as FlattenedField,
    ]

    const fieldHooks: Record<string, ExportFieldHookEntry> = {
      items: {
        type: 'beforeExport',
        fn: ({ value }) => {
          if (!Array.isArray(value)) {
            return value
          }
          return value.map((item) => ({
            ...(item as Record<string, unknown>),
            note: `${(item as Record<string, unknown>).note ?? ''}-parent`,
          }))
        },
      },
      items_note: {
        type: 'beforeExport',
        fn: ({ value }) => `${value}-child`,
      },
    }

    const result = applyFieldHooks({
      type: 'beforeExport',
      data: { items: [{ note: 'a' }, { note: 'b' }] },
      fieldHooks,
      fields,
      format: 'json',
      operation: 'export',
      req: mockReq,
    })

    expect(result.items).toEqual([{ note: 'a-parent-child' }, { note: 'b-parent-child' }])
  })

  it('should not recurse into children when the parent hook returns a primitive', () => {
    const fields: FlattenedField[] = [
      {
        name: 'meta',
        type: 'group',
        flattenedFields: [{ name: 'slug', type: 'text' } as FlattenedField],
      } as unknown as FlattenedField,
    ]

    const childFn = vi.fn(({ value }: { value: unknown }) => `${value}-from-child`)
    const fieldHooks: Record<string, ExportFieldHookEntry> = {
      meta: {
        type: 'beforeExport',
        fn: () => 'serialized',
      },
      meta_slug: {
        type: 'beforeExport',
        fn: childFn,
      },
    }

    const result = applyFieldHooks({
      type: 'beforeExport',
      data: { meta: { slug: 'raw' } },
      fieldHooks,
      fields,
      format: 'json',
      operation: 'export',
      req: mockReq,
    })

    expect(result.meta).toBe('serialized')
    expect(childFn).not.toHaveBeenCalled()
  })
})
