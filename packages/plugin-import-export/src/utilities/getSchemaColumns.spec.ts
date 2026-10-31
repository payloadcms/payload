import type { FlattenedField, SanitizedCollectionConfig } from 'payload'

import { describe, expect, it } from 'vitest'

import { getSchemaColumns, mergeColumns } from './getSchemaColumns.js'

function createCollectionConfig(
  flattenedFields: FlattenedField[],
  options?: { timestamps?: boolean; trash?: boolean; versions?: unknown },
): SanitizedCollectionConfig {
  return {
    flattenedFields,
    timestamps: options?.timestamps ?? true,
    trash: options?.trash ?? false,
    versions: options?.versions,
  } as SanitizedCollectionConfig
}

describe('getSchemaColumns', () => {
  describe('fields from flattenedFields', () => {
    it('should include all fields present in flattenedFields in their natural order', () => {
      const flattenedFields: FlattenedField[] = [
        { name: 'id', type: 'number' },
        { name: 'title', type: 'text' },
        { name: 'createdAt', type: 'date' },
        { name: 'updatedAt', type: 'date' },
      ]

      const collectionConfig = createCollectionConfig(flattenedFields)
      const result = getSchemaColumns({ collectionConfig })

      expect(result).toEqual(['id', 'title', 'createdAt', 'updatedAt'])
    })

    it('should include custom id field when defined in flattenedFields', () => {
      const flattenedFields: FlattenedField[] = [
        { name: 'id', type: 'text' },
        { name: 'title', type: 'text' },
        { name: 'createdAt', type: 'date' },
        { name: 'updatedAt', type: 'date' },
      ]

      const collectionConfig = createCollectionConfig(flattenedFields)
      const result = getSchemaColumns({ collectionConfig })

      expect(result).toContain('id')
    })

    it('should not include createdAt or updatedAt when timestamps disabled (not in flattenedFields)', () => {
      const flattenedFields: FlattenedField[] = [
        { name: 'id', type: 'number' },
        { name: 'title', type: 'text' },
      ]

      const collectionConfig = createCollectionConfig(flattenedFields, { timestamps: false })
      const result = getSchemaColumns({ collectionConfig })

      expect(result).toContain('id')
      expect(result).toContain('title')
      expect(result).not.toContain('createdAt')
      expect(result).not.toContain('updatedAt')
    })

    it('should include deletedAt when present in flattenedFields (trash enabled)', () => {
      const flattenedFields: FlattenedField[] = [
        { name: 'id', type: 'number' },
        { name: 'title', type: 'text' },
        { name: 'createdAt', type: 'date' },
        { name: 'updatedAt', type: 'date' },
        { name: 'deletedAt', type: 'date' },
      ]

      const collectionConfig = createCollectionConfig(flattenedFields)
      const result = getSchemaColumns({ collectionConfig })

      expect(result).toContain('deletedAt')
    })

    it('should add id when missing from flattenedFields (Payload core limitation)', () => {
      const flattenedFields: FlattenedField[] = [
        { name: 'title', type: 'text' },
        { name: 'excerpt', type: 'textarea' },
        { name: 'createdAt', type: 'date' },
        { name: 'updatedAt', type: 'date' },
      ]

      const collectionConfig = createCollectionConfig(flattenedFields)
      const result = getSchemaColumns({ collectionConfig })

      // id is added because Payload core doesn't add it to flattenedFields
      // but it exists on every document
      expect(result).toContain('id')
      expect(result[0]).toBe('id')
      expect(result).toEqual(['id', 'title', 'excerpt', 'createdAt', 'updatedAt'])
    })
  })
})

describe('mergeColumns', () => {
  it('should replace array schema columns with the column derived by a beforeExport hook', () => {
    const schemaColumns = ['id', 'title', 'tags_0_label', 'tags_0_id', 'updatedAt', 'createdAt']
    const dataColumns = ['id', 'title', 'tags', 'updatedAt', 'createdAt']

    expect(mergeColumns(schemaColumns, dataColumns)).toEqual([
      'id',
      'title',
      'tags',
      'updatedAt',
      'createdAt',
    ])
  })

  it('should replace group schema columns with the column derived by a beforeExport hook', () => {
    const schemaColumns = ['id', 'meta_title', 'meta_description', 'createdAt']
    const dataColumns = ['id', 'meta', 'createdAt']

    expect(mergeColumns(schemaColumns, dataColumns)).toEqual(['id', 'meta', 'createdAt'])
  })

  it('should keep array schema columns that are still present in the data', () => {
    const schemaColumns = ['id', 'tags_0_label', 'tags_0_id', 'createdAt']
    const dataColumns = [
      'id',
      'tags_0_label',
      'tags_0_id',
      'tags_1_label',
      'tags_1_id',
      'createdAt',
    ]

    expect(mergeColumns(schemaColumns, dataColumns)).toEqual([
      'id',
      'tags_0_label',
      'tags_1_label',
      'tags_0_id',
      'tags_1_id',
      'createdAt',
    ])
  })

  it('should still replace a relationship column with columns derived from it', () => {
    const schemaColumns = ['id', 'user', 'createdAt']
    const dataColumns = ['id', 'user_id', 'user_email', 'createdAt']

    expect(mergeColumns(schemaColumns, dataColumns)).toEqual([
      'id',
      'user_id',
      'user_email',
      'createdAt',
    ])
  })
})
