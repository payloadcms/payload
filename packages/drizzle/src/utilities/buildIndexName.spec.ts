import type { DrizzleAdapter } from '../types.js'

import { buildIndexName } from './buildIndexName.js'

describe('buildIndexName', () => {
  let mockAdapter: Pick<DrizzleAdapter, 'indexes' | 'rawTables'>

  beforeEach(() => {
    mockAdapter = {
      indexes: new Set(),
      rawTables: {},
    }
  })

  it('should create index name with _idx suffix by default', () => {
    const result = buildIndexName({
      name: 'users_email',
      adapter: mockAdapter as DrizzleAdapter,
    })

    expect(result).toBe('users_email_idx')
    expect(mockAdapter.indexes.has('users_email_idx')).toBe(true)
  })

  it('should truncate long index names to 60 characters', () => {
    const longName = 'users_v_version_ingredient_sections_section_ingredients_locale'
    const result = buildIndexName({
      name: longName,
      adapter: mockAdapter as DrizzleAdapter,
    })

    // Should be truncated to 60 chars total (56 chars + _idx)
    expect(result.length).toBeLessThanOrEqual(60)
    expect(result.endsWith('_idx')).toBe(true)
    expect(mockAdapter.indexes.has(result)).toBe(true)
  })

  it('should handle duplicate names by appending numbers', () => {
    const name = 'duplicate_index'

    const first = buildIndexName({
      name,
      adapter: mockAdapter as DrizzleAdapter,
    })

    const second = buildIndexName({
      name,
      adapter: mockAdapter as DrizzleAdapter,
    })

    expect(first).toBe('duplicate_index_idx')
    expect(second).toBe('duplicate_index_1_idx')
    expect(mockAdapter.indexes.has(first)).toBe(true)
    expect(mockAdapter.indexes.has(second)).toBe(true)
  })

  it('should work without suffix when appendSuffix is false', () => {
    const result = buildIndexName({
      name: 'users_unique',
      adapter: mockAdapter as DrizzleAdapter,
      appendSuffix: false,
    })

    expect(result).toBe('users_unique')
    expect(mockAdapter.indexes.has('users_unique')).toBe(true)
  })

  it('should truncate very long names even with numbering', () => {
    const veryLongName =
      'extremely_long_table_name_with_nested_arrays_and_localization_and_versioning'

    const first = buildIndexName({
      name: veryLongName,
      adapter: mockAdapter as DrizzleAdapter,
    })

    const second = buildIndexName({
      name: veryLongName,
      adapter: mockAdapter as DrizzleAdapter,
    })

    expect(first.length).toBeLessThanOrEqual(60)
    expect(second.length).toBeLessThanOrEqual(60)
    expect(first).not.toBe(second)
  })
})
