import type { Config } from 'payload'

import { describe, expect, it } from 'vitest'

import { gcsStorage } from './index.js'

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

describe('gcsStorage when disabled', () => {
  it('should insert the prefix and object key fields when alwaysInsertFields is true', () => {
    const config = gcsStorage({
      alwaysInsertFields: true,
      bucket: 'test-bucket',
      collections: {
        media: true,
      },
      enabled: false,
      options: {},
    })(createConfig()) as Config

    expect(getMediaFieldNames(config)).toEqual(expect.arrayContaining(['prefix', '_objectKey']))
  })

  it('should not insert fields when alwaysInsertFields is not set', () => {
    const config = gcsStorage({
      bucket: 'test-bucket',
      collections: {
        media: true,
      },
      enabled: false,
      options: {},
    })(createConfig()) as Config

    expect(getMediaFieldNames(config)).toEqual([])
  })
})
