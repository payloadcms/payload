import { PayloadRequest } from 'payload'

import type { ExportFieldHookEntry } from '../types.js'

import { describe, expect, it, vi } from 'vitest'

import { flattenObject } from './flattenObject.js'

const mockReq = {
  payload: {
    logger: {
      error: vi.fn(),
    },
  },
} as unknown as PayloadRequest

describe('flattenObject parent + child traversal', () => {
  it('should run a parent group hook and still apply child field hooks against the transformed value', () => {
    const exportFieldHooks: Record<string, ExportFieldHookEntry> = {
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

    const row = flattenObject({
      data: { meta: { slug: 'raw' } },
      exportFieldHooks,
      format: 'csv',
      req: mockReq,
    })

    expect(row.meta_slug).toBe('raw-from-parent-from-child')
  })

  it('should still recurse into children when the parent group hook returns undefined', () => {
    const childCalls: unknown[] = []
    const exportFieldHooks: Record<string, ExportFieldHookEntry> = {
      meta: {
        type: 'beforeExport',
        fn: () => undefined,
      },
      meta_slug: {
        type: 'beforeExport',
        fn: ({ value }) => {
          childCalls.push(value)
          return `${value}-from-child`
        },
      },
    }

    const row = flattenObject({
      data: { meta: { slug: 'raw' } },
      exportFieldHooks,
      format: 'csv',
      req: mockReq,
    })

    expect(childCalls).toEqual(['raw'])
    expect(row.meta_slug).toBe('raw-from-child')
  })

  it('should not recurse into children when the parent hook returns a primitive', () => {
    const childFn = vi.fn(({ value }: { value: unknown }) => `${value}-from-child`)
    const exportFieldHooks: Record<string, ExportFieldHookEntry> = {
      meta: {
        type: 'beforeExport',
        fn: () => 'serialized',
      },
      meta_slug: {
        type: 'beforeExport',
        fn: childFn,
      },
    }

    const row = flattenObject({
      data: { meta: { slug: 'raw' } },
      exportFieldHooks,
      format: 'csv',
      req: mockReq,
    })

    expect(row.meta).toBe('serialized')
    expect(row.meta_slug).toBeUndefined()
    expect(childFn).not.toHaveBeenCalled()
  })

  it('should fall back to default array flattening when an undefined-returning hook did not write any keys, even if a sibling key with a matching prefix exists', () => {
    const exportFieldHooks: Record<string, ExportFieldHookEntry> = {
      tag: {
        type: 'beforeExport',
        fn: () => undefined,
      },
    }

    const row = flattenObject({
      data: { tag_meta: 'sibling-set-first', tag: ['a', 'b'] },
      exportFieldHooks,
      format: 'csv',
      req: mockReq,
    })

    expect(row.tag_meta).toBe('sibling-set-first')
    expect(row.tag_0).toBe('a')
    expect(row.tag_1).toBe('b')
  })

  it('should run a parent array hook then child hooks for each item', () => {
    const exportFieldHooks: Record<string, ExportFieldHookEntry> = {
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

    const row = flattenObject({
      data: { items: [{ note: 'a' }, { note: 'b' }] },
      exportFieldHooks,
      format: 'csv',
      req: mockReq,
    })

    expect(row.items_0_note).toBe('a-parent-child')
    expect(row.items_1_note).toBe('b-parent-child')
  })
})
