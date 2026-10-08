import type { Config } from 'payload'

import { describe, expect, it } from 'vitest'

import { uploadthingStorage } from './index.js'

const createConfig = (): Config =>
  ({
    collections: [
      {
        slug: 'media',
        fields: [],
        upload: true,
      },
    ],
    secret: 'test-secret',
  }) as unknown as Config

const getMediaFieldNames = (config: Config): string[] =>
  (config.collections?.find((collection) => collection.slug === 'media')?.fields ?? []).flatMap(
    (field) => ('name' in field ? [field.name] : []),
  )

describe('uploadthingStorage when disabled', () => {
  it('should insert the prefix and object key fields when alwaysInsertFields is true', () => {
    const config = uploadthingStorage({
      alwaysInsertFields: true,
      collections: {
        media: true,
      },
      enabled: false,
      options: {
        token: 'test-token',
      },
    })(createConfig()) as Config

    expect(getMediaFieldNames(config)).toEqual(expect.arrayContaining(['prefix', '_objectKey']))
  })

  it('should not insert fields when alwaysInsertFields is not set', () => {
    const config = uploadthingStorage({
      collections: {
        media: true,
      },
      enabled: false,
      options: {
        token: 'test-token',
      },
    })(createConfig()) as Config

    expect(getMediaFieldNames(config)).toEqual([])
  })
})
