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
    rawTables: {},
    shouldCompressIdentifiers: false,
    foreignKeys: new Set(),
    indexes: new Set(),
    ...overrides,
  } as unknown as DrizzleAdapter
  return { adapter, trackers, warn }
}

describe('getIdentifier', () => {
  describe('compressed mode', () => {
    it('should return original when segments fit', () => {
      const { adapter } = makeAdapter({ shouldCompressIdentifiers: true })
      const fn = createGetIdentifier(adapter)
      expect(fn({ segments: ['users', 'email'], suffix: '_idx', type: 'index' })).toBe(
        'users_email_idx',
      )
    })

    it('should compress when segments exceed max length', () => {
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
    it('should pass short names through unchanged', () => {
      const { adapter } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      expect(fn({ segments: ['posts', 'title'], suffix: '_idx', type: 'index' })).toBe(
        'posts_title_idx',
      )
    })

    it('should truncate long index names silently in legacy mode (matches pre-refactor buildIndexName)', () => {
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

    it('should warn but not truncate tables/enums/columns in legacy mode', () => {
      const { adapter, warn } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      const longBody = 'a'.repeat(80)
      const result = fn({ segments: [longBody], type: 'table' })
      expect(result).toBe(longBody)
      expect(result.length).toBe(80)
      expect(warn.mock.calls.some(([msg]) => String(msg).includes('exceeds'))).toBe(true)
    })

    it('should disambiguate identical index bodies across tables with _<n>', () => {
      const { adapter } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      const first = fn({ segments: ['compound_index'], suffix: '_idx', type: 'index' })
      const second = fn({ segments: ['compound_index'], suffix: '_idx', type: 'index' })
      expect(first).toBe('compound_index_idx')
      expect(second).toBe('compound_index_1_idx')
    })
  })

  describe('customName', () => {
    it('should return customName verbatim', () => {
      const { adapter } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      expect(fn({ customName: 'my_table', type: 'table' })).toBe('my_table')
    })

    it('should warn when customName exceeds maxIdentifierLength', () => {
      const { adapter, warn } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      fn({ customName: 'a'.repeat(80), type: 'table' })
      expect(warn).toHaveBeenCalled()
      expect(warn.mock.calls.some(([msg]) => String(msg).includes('exceeds'))).toBe(true)
    })
  })

  describe('collision detection', () => {
    it('should throw on cross-type collision in schema tracker (compressed)', () => {
      const { adapter } = makeAdapter({ shouldCompressIdentifiers: true })
      const fn = createGetIdentifier(adapter)
      fn({ segments: ['abc'], type: 'table' })
      expect(() => fn({ segments: ['abc'], type: 'enum' })).toThrow(/already exists as table/i)
    })

    it('should throw on cross-type collision in schema tracker (legacy)', () => {
      const { adapter } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      fn({ segments: ['abc'], type: 'table' })
      expect(() => fn({ segments: ['abc'], type: 'enum' })).toThrow(/already exists as table/i)
    })

    it('should not throw on same-name re-request of same type (cache hit)', () => {
      const { adapter } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      const a = fn({ segments: ['abc'], type: 'table' })
      const b = fn({ segments: ['abc'], type: 'table' })
      expect(a).toBe(b)
    })

    it('should scope column collisions per-parentTable', () => {
      const { adapter } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      expect(fn({ parentTable: 'users', segments: ['email'], type: 'column' })).toBe('email')
      expect(fn({ parentTable: 'posts', segments: ['email'], type: 'column' })).toBe('email')
    })

    it('should not populate the cache when a cross-type collision throws', () => {
      const { adapter } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      fn({ segments: ['abc'], type: 'table' })
      expect(() => fn({ segments: ['abc'], type: 'enum' })).toThrow()
      // Retrying the failing request must still throw (not return a cached value).
      expect(() => fn({ segments: ['abc'], type: 'enum' })).toThrow()
    })

    it('should allow the same name on a schema-level table and a column of an unrelated table', () => {
      const { adapter } = makeAdapter()
      const fn = createGetIdentifier(adapter)
      expect(fn({ segments: ['abc'], type: 'table' })).toBe('abc')
      expect(fn({ parentTable: 'owner', segments: ['abc'], type: 'column' })).toBe('abc')
    })
  })

  describe('cache', () => {
    it('should return the same string for identical inputs', () => {
      const { adapter } = makeAdapter({ shouldCompressIdentifiers: true })
      const fn = createGetIdentifier(adapter)
      const a = fn({ segments: ['x', 'y'], suffix: '_idx', type: 'index' })
      const b = fn({ segments: ['x', 'y'], suffix: '_idx', type: 'index' })
      expect(a).toBe(b)
    })
  })
})
