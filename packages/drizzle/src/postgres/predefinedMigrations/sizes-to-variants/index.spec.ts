import { PgDialect } from 'drizzle-orm/pg-core'
import { describe, expect, it, vi } from 'vitest'

import type { SizesToVariantsIndexRename } from '../../../utilities/getSizesToVariantsRenames.js'

import {
  getPostgresSchemaRelationNames,
  reservePostgresLegacyIndexName,
  resolvePostgresIndexRename,
} from './index.js'
import { buildGeneratedLegacyIndexName } from '../../../utilities/getSizesToVariantsRenames.js'

const plannedIndex: SizesToVariantsIndexRename = {
  columns: ['variants_thumbnail_filename'],
  legacyNameBase: 'media_sizes_thumbnail_sizes_thumbnail_filename',
  to: 'media_variants_thumbnail_variants_thumbnail_filename_idx',
  unique: false,
}

describe('resolvePostgresIndexRename', () => {
  it('should select the generated legacy index instead of another index on the same columns', () => {
    expect(
      resolvePostgresIndexRename({
        existingIndexes: [
          {
            columns: plannedIndex.columns,
            isPartial: true,
            name: 'custom_partial_idx',
            unique: false,
          },
          {
            columns: plannedIndex.columns,
            isPartial: false,
            name: 'media_sizes_thumbnail_sizes_thumbnail_filename_idx',
            unique: false,
          },
        ],
        index: plannedIndex,
        tableName: 'media',
      }),
    ).toBe('media_sizes_thumbnail_sizes_thumbnail_filename_idx')
  })

  it('should select a compatible generated suffix when the base name belongs to another index', () => {
    expect(
      resolvePostgresIndexRename({
        existingIndexes: [
          {
            columns: ['other_column'],
            isPartial: false,
            name: 'media_sizes_thumbnail_sizes_thumbnail_filename_idx',
            unique: false,
          },
          {
            columns: plannedIndex.columns,
            isPartial: false,
            name: 'media_sizes_thumbnail_sizes_thumbnail_filename_1_idx',
            unique: false,
          },
        ],
        index: plannedIndex,
        tableName: 'media',
      }),
    ).toBe('media_sizes_thumbnail_sizes_thumbnail_filename_1_idx')
  })

  it('should reject a generated legacy index with different uniqueness', () => {
    expect(() =>
      resolvePostgresIndexRename({
        existingIndexes: [
          {
            columns: plannedIndex.columns,
            isPartial: false,
            name: 'media_sizes_thumbnail_sizes_thumbnail_filename_idx',
            unique: true,
          },
        ],
        index: plannedIndex,
        tableName: 'media',
      }),
    ).toThrow('does not match the expected columns, uniqueness, or predicate')
  })

  it('should reject an incompatible destination index', () => {
    expect(() =>
      resolvePostgresIndexRename({
        existingIndexes: [
          {
            columns: ['variants_thumbnail_width'],
            isPartial: false,
            name: plannedIndex.to,
            unique: false,
          },
        ],
        index: plannedIndex,
        tableName: 'media',
      }),
    ).toThrow('does not match the expected columns, uniqueness, or predicate')
  })

  it('should accept a compatible destination index without another rename', () => {
    expect(
      resolvePostgresIndexRename({
        existingIndexes: [
          {
            columns: plannedIndex.columns,
            isPartial: false,
            name: plannedIndex.to,
            unique: false,
          },
        ],
        index: plannedIndex,
        tableName: 'media',
      }),
    ).toBeUndefined()
  })
})

describe('reservePostgresLegacyIndexName', () => {
  it('should resolve and reserve numeric suffixes for truncated generated names', () => {
    const sharedPrefix = `media_sizes_${'shared_'.repeat(10)}`
    const firstBase = `${sharedPrefix}alpha_filename`
    const secondBase = `${sharedPrefix}beta_filename`
    const firstIndex = {
      ...plannedIndex,
      columns: ['variants_alpha_filename'],
      legacyNameBase: firstBase,
    }
    const secondIndex = {
      ...plannedIndex,
      columns: ['variants_beta_filename'],
      legacyNameBase: secondBase,
    }
    const firstGeneratedName = buildGeneratedLegacyIndexName(firstBase)
    const secondGeneratedName = buildGeneratedLegacyIndexName(secondBase, 1)
    const existingIndexes = [
      {
        columns: firstIndex.columns,
        isPartial: false,
        name: firstGeneratedName,
        unique: false,
      },
      {
        columns: secondIndex.columns,
        isPartial: false,
        name: secondGeneratedName,
        unique: false,
      },
    ]

    expect(
      resolvePostgresIndexRename({
        existingIndexes,
        index: firstIndex,
        tableName: 'media',
      }),
    ).toBe(firstGeneratedName)
    expect(
      resolvePostgresIndexRename({
        existingIndexes,
        index: secondIndex,
        tableName: 'media',
      }),
    ).toBe(secondGeneratedName)

    const reservedRelationNames = new Set<string>()

    const firstName = reservePostgresLegacyIndexName({
      existingIndexes: [],
      index: firstIndex,
      reservedRelationNames,
    })
    const secondName = reservePostgresLegacyIndexName({
      existingIndexes: [],
      index: secondIndex,
      reservedRelationNames,
    })

    expect(firstName).toBe(firstGeneratedName)
    expect(secondName).toBe(secondGeneratedName)
    expect(firstName).not.toBe(secondName)
  })

  it('should reserve an unsuffixed generated name owned by a table', async () => {
    const legacyNameBase = `media_sizes_${'reserved_'.repeat(10)}filename`
    const reservedTableName = buildGeneratedLegacyIndexName(legacyNameBase)
    const dialect = new PgDialect()
    const db = {
      execute: vi.fn((query) => {
        expect(dialect.sqlToQuery(query).sql).toContain('FROM pg_class')

        return Promise.resolve({ rows: [{ name: reservedTableName }] })
      }),
    }
    const reservedRelationNames = await getPostgresSchemaRelationNames({
      db,
      schemaName: 'public',
    })

    expect(
      reservePostgresLegacyIndexName({
        existingIndexes: [],
        index: { ...plannedIndex, legacyNameBase },
        reservedRelationNames,
      }),
    ).toBe(buildGeneratedLegacyIndexName(legacyNameBase, 1))
  })
})
