import type { Config, SanitizedConfig } from 'payload'

import { sanitizeConfig } from 'payload'

import { buildSortParam } from './buildSortParam.js'
import { MongooseAdapter } from '../index.js'

let config: SanitizedConfig

describe('builds sort params', () => {
  beforeAll(async () => {
    config = await sanitizeConfig({
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

    expect(result).toStrictEqual({ sorting: { order: 'asc', createdAt: 'desc' } })
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

    expect(result).toStrictEqual({ sorting: { createdAt: 'desc' } })
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

    expect(result).toStrictEqual({ sorting: { order: 'asc' } })
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

    expect(result).toStrictEqual({ sorting: { order: 'asc' } })
  })

  it('returns collation when sortCaseInsensitive is enabled', () => {
    const result = buildSortParam({
      config,
      parentIsLocalized: false,
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: { sortCaseInsensitive: true },
        },
      ],
      locale: 'en',
      sort: ['title'],
      timestamps: false,
      adapter: { disableFallbackSort: false } as MongooseAdapter,
    })

    expect(result.sorting).toStrictEqual({ title: 'asc' })
    expect(result.collation).toStrictEqual({ locale: 'en', strength: 2 })
  })
})
