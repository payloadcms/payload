import type { PipelineStage } from 'mongoose'
import type { Config, FlattenedField, SanitizedConfig } from 'payload'
import { describe, beforeAll, it, expect } from 'vitest'

import { sanitizeConfig } from 'payload'

import { buildSortParam } from './buildSortParam.js'
import { MongooseAdapter } from '../index.js'

let config: SanitizedConfig

describe('builds sort params', () => {
  beforeAll(async () => {
    config = sanitizeConfig({
      localization: {
        defaultLocale: 'en',
        fallback: true,
        locales: ['en', 'es'],
      },
    } as Config)
  })
  it('adds a fallback on non-unique field', () => {
    const result = buildSortParam({
      config,
      parentIsLocalized: false,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'order',
          type: 'number',
        },
      ],
      locale: 'en',
      sort: 'order',
      timestamps: true,
      adapter: {
        disableFallbackSort: false,
      } as MongooseAdapter,
    })

    expect(result).toStrictEqual({ order: 'asc', createdAt: 'desc' })
  })

  it('adds a fallback when sort isnt provided', () => {
    const result = buildSortParam({
      config,
      parentIsLocalized: false,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'order',
          type: 'number',
        },
      ],
      locale: 'en',
      sort: undefined,
      timestamps: true,
      adapter: {
        disableFallbackSort: false,
      } as MongooseAdapter,
    })

    expect(result).toStrictEqual({ createdAt: 'desc' })
  })

  it('does not add a fallback on non-unique field when disableFallbackSort is true', () => {
    const result = buildSortParam({
      config,
      parentIsLocalized: false,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'order',
          type: 'number',
        },
      ],
      locale: 'en',
      sort: 'order',
      timestamps: true,
      adapter: {
        disableFallbackSort: true,
      } as MongooseAdapter,
    })

    expect(result).toStrictEqual({ order: 'asc' })
  })

  // This test should be true even when disableFallbackSort is false
  it('does not add a fallback on unique field', () => {
    const result = buildSortParam({
      config,
      parentIsLocalized: false,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'order',
          type: 'number',
          unique: true, // Marking this field as unique
        },
      ],
      locale: 'en',
      sort: 'order',
      timestamps: true,
      adapter: {
        disableFallbackSort: false,
      } as MongooseAdapter,
    })

    expect(result).toStrictEqual({ order: 'asc' })
  })

  it('joins the related collection when sorting by a related field', () => {
    const sortAggregation: PipelineStage[] = []

    const result = buildSortParam({
      adapter: createAdapterWithAuthors(),
      config,
      fields: postFields,
      locale: 'en',
      sort: 'author.name',
      sortAggregation,
      timestamps: true,
    })

    expect(result).toStrictEqual({ '__author.name': 'asc' })
    expect(sortAggregation).toHaveLength(1)
  })

  it('does not join the related collection when sorting by an unknown related field', () => {
    const sortAggregation: PipelineStage[] = []

    buildSortParam({
      adapter: createAdapterWithAuthors(),
      config,
      fields: postFields,
      locale: 'en',
      sort: 'author.unknownField',
      sortAggregation,
      timestamps: true,
    })

    expect(sortAggregation).toHaveLength(0)
  })
})

const postFields: FlattenedField[] = [
  {
    name: 'author',
    type: 'relationship',
    relationTo: 'authors',
  },
]

function createAdapterWithAuthors(): MongooseAdapter {
  return {
    collections: {
      authors: { collection: { name: 'authors' } },
    },
    disableFallbackSort: true,
    payload: {
      collections: {
        authors: {
          config: {
            flattenedFields: [
              {
                name: 'name',
                type: 'text',
              },
            ],
          },
        },
      },
    },
  } as unknown as MongooseAdapter
}
