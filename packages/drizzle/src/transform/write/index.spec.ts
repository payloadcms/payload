import type { FlattenedField } from 'payload'

import { describe, expect, it } from 'vitest'

import type { DrizzleAdapter } from '../../types.js'

import { transformForWrite } from './index.js'
import type { RowToInsert } from './types.js'

describe('transformForWrite', () => {
  const localizedAdapter = {
    payload: {
      config: {
        localization: {
          localeCodes: ['de', 'en', 'fr'],
        },
      },
    },
    tableNameMap: new Map(),
  } as unknown as DrizzleAdapter

  it('should retain the supplied locale scope for localized has-many selects', () => {
    const adapter = {
      payload: {
        config: {
          localization: {
            localeCodes: ['de', 'en', 'fr'],
          },
        },
      },
      tableNameMap: new Map([['documents_tags', 'documents_tags']]),
    } as unknown as DrizzleAdapter
    const fields = [
      {
        hasMany: true,
        localized: true,
        name: 'tags',
        options: ['one', 'two'],
        type: 'select',
      },
    ] as FlattenedField[]

    const transformed = transformForWrite({
      adapter,
      data: {
        tags: {
          de: [],
          en: ['one'],
        },
      },
      fields,
      tableName: 'documents',
    }) as RowToInsert & {
      selectsToDelete: Record<string, { locale?: string }[]>
    }

    expect(transformed.selectsToDelete).toEqual({
      documents_tags: [{ locale: 'de' }, { locale: 'en' }],
    })
  })

  it('should retain the parent locale scope for has-many selects in localized groups', () => {
    const adapter = {
      payload: {
        config: {
          localization: {
            localeCodes: ['de', 'en', 'fr'],
          },
        },
      },
      tableNameMap: new Map([['documents_metadata_tags', 'documents_metadata_tags']]),
    } as unknown as DrizzleAdapter
    const fields = [
      {
        flattenedFields: [
          {
            hasMany: true,
            name: 'tags',
            options: ['one', 'two'],
            type: 'select',
          },
        ],
        localized: true,
        name: 'metadata',
        type: 'group',
      },
    ] as FlattenedField[]

    const transformed = transformForWrite({
      adapter,
      data: {
        metadata: {
          de: { tags: [] },
          en: { tags: ['one'] },
        },
      },
      fields,
      tableName: 'documents',
    })

    expect(transformed.selectsToDelete).toEqual({
      documents_metadata_tags: [{ locale: 'de' }, { locale: 'en' }],
    })
  })

  it('should record empty localized has-many relationships as locale-scoped deletes', () => {
    const fields = [
      {
        hasMany: true,
        localized: true,
        name: 'categories',
        relationTo: 'categories',
        type: 'relationship',
      },
    ] as FlattenedField[]

    const transformed = transformForWrite({
      adapter: localizedAdapter,
      data: {
        categories: {
          de: [],
          en: ['english-category'],
        },
      },
      fields,
      tableName: 'documents',
    })

    expect(transformed.relationshipsToDelete).toEqual([{ locale: 'de', path: 'categories' }])
    expect(transformed.relationships).toEqual([
      {
        categoriesID: 'english-category',
        locale: 'en',
        order: 1,
        path: 'categories',
      },
    ])
  })

  it('should retain the parent locale scope when clearing inherited has-many relationships', () => {
    const fields = [
      {
        flattenedFields: [
          {
            hasMany: true,
            name: 'categories',
            relationTo: 'categories',
            type: 'relationship',
          },
        ],
        localized: true,
        name: 'metadata',
        type: 'group',
      },
    ] as FlattenedField[]

    const transformed = transformForWrite({
      adapter: localizedAdapter,
      data: {
        metadata: {
          de: { categories: [] },
        },
      },
      fields,
      tableName: 'documents',
    })

    expect(transformed.relationshipsToDelete).toEqual([
      { locale: 'de', path: 'metadata.categories' },
    ])
  })

  it('should retain inherited locale scopes for relationship push and remove operations', () => {
    const fields = [
      {
        flattenedFields: [
          {
            hasMany: true,
            name: 'categories',
            relationTo: 'categories',
            type: 'relationship',
          },
        ],
        localized: true,
        name: 'metadata',
        type: 'group',
      },
    ] as FlattenedField[]

    const transformed = transformForWrite({
      adapter: localizedAdapter,
      data: {
        metadata: {
          de: { categories: { $push: 'german-category' } },
          en: { categories: { $remove: 'english-category' } },
        },
      },
      fields,
      tableName: 'documents',
    })

    expect(transformed.relationshipsToAppend).toEqual([
      {
        locale: 'de',
        path: 'metadata.categories',
        relationTo: 'categories',
        value: 'german-category',
      },
    ])
    expect(transformed.relationshipsToDelete).toEqual([
      {
        itemToRemove: 'english-category',
        locale: 'en',
        path: 'metadata.categories',
        relationTo: 'categories',
      },
    ])
  })
})
