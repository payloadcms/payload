import { describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter } from '../types.js'
import type { IdentifierTrackers } from './getIdentifier.types.js'

import { createGetIdentifier } from './getIdentifier.js'

const makeAdapter = (overrides: Partial<DrizzleAdapter> = {}) => {
  const trackers: IdentifierTrackers = {
    columnsByTable: new Map(),
    fksByTable: new Map(),
    schema: new Map(),
  }
  const warn = vi.fn()
  const adapter = {
    identifierCache: new Map<string, string>(),
    identifierTrackers: trackers,
    maxIdentifierLength: 63,
    payload: { logger: { warn } } as any,
    shouldCompressIdentifiers: false,
    foreignKeys: new Set(),
    indexes: new Set(),
    ...overrides,
  } as unknown as DrizzleAdapter
  return { adapter, trackers, warn }
}

describe('getIdentifier', () => {
  describe('compressed mode', () => {
    it('returns original when segments fit', () => {
      const { adapter } = makeAdapter({ shouldCompressIdentifiers: true })
      const fn = createGetIdentifier(adapter)
      expect(fn({ segments: ['users', 'email'], suffix: '_idx', type: 'index' })).toBe(
        'users_email_idx',
      )
    })

    it('compresses when segments exceed max length', () => {
      const { adapter } = makeAdapter({ shouldCompressIdentifiers: true })
      const fn = createGetIdentifier(adapter)
      const out = fn({
        parentTable: 'very_long_parent_table_name_here',
        segments: ['very_long_parent_table_name_here', 'very_long_child_table_name_here', 'id'],
        suffix: '_fk',
        type: 'fk',
      })
      expect(out.length).toBeLessThanOrEqual(63)
      expect(out.endsWith('_fk')).toBe(true)
    })
  })

  describe('legacy mode', () => {
    it('passes short names through unchanged', () => {
      const { adapter } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      expect(fn({ segments: ['posts', 'title'], suffix: '_idx', type: 'index' })).toBe(
        'posts_title_idx',
      )
    })

    it('truncates long index names silently in legacy mode (matches pre-refactor buildIndexName)', () => {
      const { adapter, warn } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      const result = fn({
        segments: ['a'.repeat(80)],
        suffix: '_idx',
        type: 'index',
      })
      // legacyTruncate caps at 60 chars, so the output never exceeds maxIdentifierLength (63)
      // and no warning fires — matching the historical buildIndexName behavior.
      expect(result.length).toBeLessThanOrEqual(60)
      expect(result.endsWith('_idx')).toBe(true)
      expect(warn).not.toHaveBeenCalled()
    })

    it('warns but does not truncate tables/enums/columns in legacy mode', () => {
      const { adapter, warn } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      const longBody = 'a'.repeat(80)
      const result = fn({ segments: [longBody], type: 'table' })
      expect(result).toBe(longBody)
      expect(result.length).toBe(80)
      expect(warn.mock.calls.some(([msg]) => String(msg).includes('exceeds'))).toBe(true)
    })
  })

  describe('customName', () => {
    it('returns customName verbatim', () => {
      const { adapter } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      expect(fn({ customName: 'my_table', type: 'table' })).toBe('my_table')
    })

    it('warns when customName exceeds maxIdentifierLength', () => {
      const { adapter, warn } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      fn({ customName: 'a'.repeat(80), type: 'table' })
      expect(warn).toHaveBeenCalled()
      expect(warn.mock.calls.some(([msg]) => String(msg).includes('exceeds'))).toBe(true)
    })
  })

  describe('collision detection', () => {
    it('throws on cross-type collision in schema tracker (compressed)', () => {
      const { adapter } = makeAdapter({ shouldCompressIdentifiers: true })
      const fn = createGetIdentifier(adapter)
      fn({ segments: ['abc'], type: 'table' })
      expect(() => fn({ segments: ['abc'], type: 'enum' })).toThrow(/already exists as table/i)
    })

    it('throws on cross-type collision in schema tracker (legacy)', () => {
      const { adapter } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      fn({ segments: ['abc'], type: 'table' })
      expect(() => fn({ segments: ['abc'], type: 'enum' })).toThrow(/already exists as table/i)
    })

    it('does not throw on same-name re-request of same type (cache hit)', () => {
      const { adapter } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      const a = fn({ segments: ['abc'], type: 'table' })
      const b = fn({ segments: ['abc'], type: 'table' })
      expect(a).toBe(b)
    })

    it('scopes column collisions per-parentTable', () => {
      const { adapter } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      expect(fn({ parentTable: 'users', segments: ['email'], type: 'column' })).toBe('email')
      expect(fn({ parentTable: 'posts', segments: ['email'], type: 'column' })).toBe('email')
    })

    it('does not populate the cache when a cross-type collision throws', () => {
      const { adapter } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      fn({ segments: ['abc'], type: 'table' })
      expect(() => fn({ segments: ['abc'], type: 'enum' })).toThrow()
      // Retrying the failing request must still throw (not return a cached value).
      expect(() => fn({ segments: ['abc'], type: 'enum' })).toThrow()
    })

    it('allows the same name on a schema-level table and a column of an unrelated table', () => {
      const { adapter } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      expect(fn({ segments: ['abc'], type: 'table' })).toBe('abc')
      expect(fn({ parentTable: 'owner', segments: ['abc'], type: 'column' })).toBe('abc')
    })
  })

  describe('cache', () => {
    it('returns the same string for identical inputs', () => {
      const { adapter } = makeAdapter({ shouldCompressIdentifiers: true })
      const fn = createGetIdentifier(adapter)
      const a = fn({ segments: ['x', 'y'], suffix: '_idx', type: 'index' })
      const b = fn({ segments: ['x', 'y'], suffix: '_idx', type: 'index' })
      expect(a).toBe(b)
    })
  })
})
