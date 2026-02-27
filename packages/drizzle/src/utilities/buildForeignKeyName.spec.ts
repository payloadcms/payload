import type { DrizzleAdapter } from '../types.js'

import { buildForeignKeyName } from './buildForeignKeyName.js'

describe('buildForeignKeyName', () => {
  let mockAdapter: Pick<DrizzleAdapter, 'foreignKeys'>

  beforeEach(() => {
    mockAdapter = {
      foreignKeys: new Set(),
    }
  })

  it('should create foreign key name with _fk suffix', () => {
    const result = buildForeignKeyName({
      name: 'users_post_id',
      adapter: mockAdapter as DrizzleAdapter,
    })

    expect(result).toBe('users_post_id_fk')
    expect(mockAdapter.foreignKeys.has('users_post_id_fk')).toBe(true)
  })

  it('should truncate long foreign key names to 60 characters', () => {
    const longName = 'users_v_version_ingredient_sections_section_ingredients_parent'
    const result = buildForeignKeyName({
      name: longName,
      adapter: mockAdapter as DrizzleAdapter,
    })

    // Should be truncated to 60 chars total (57 chars + _fk)
    expect(result.length).toBeLessThanOrEqual(60)
    expect(result.endsWith('_fk')).toBe(true)
    expect(mockAdapter.foreignKeys.has(result)).toBe(true)
  })

  it('should handle duplicate names by appending numbers', () => {
    const name = 'duplicate_foreign_key'

    const first = buildForeignKeyName({
      name,
      adapter: mockAdapter as DrizzleAdapter,
    })

    const second = buildForeignKeyName({
      name,
      adapter: mockAdapter as DrizzleAdapter,
    })

    expect(first).toBe('duplicate_foreign_key_fk')
    expect(second).toBe('duplicate_foreign_key_1_fk')
    expect(mockAdapter.foreignKeys.has(first)).toBe(true)
    expect(mockAdapter.foreignKeys.has(second)).toBe(true)
  })

  it('should truncate very long names even with numbering', () => {
    const veryLongName =
      'extremely_long_table_name_with_nested_arrays_and_localization_and_versioning_parent_id'

    const first = buildForeignKeyName({
      name: veryLongName,
      adapter: mockAdapter as DrizzleAdapter,
    })

    const second = buildForeignKeyName({
      name: veryLongName,
      adapter: mockAdapter as DrizzleAdapter,
    })

    expect(first.length).toBeLessThanOrEqual(60)
    expect(second.length).toBeLessThanOrEqual(60)
    expect(first).not.toBe(second)
  })

  it('should ensure PostgreSQL 63-character limit is respected', () => {
    // PostgreSQL has a 63-character limit for identifiers
    // We truncate to 60 to leave room for suffixes and numbering
    const name = 'a'.repeat(100) // Very long name

    const result = buildForeignKeyName({
      name,
      adapter: mockAdapter as DrizzleAdapter,
    })

    expect(result.length).toBeLessThanOrEqual(63)
  })
})
