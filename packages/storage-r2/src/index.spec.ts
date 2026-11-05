import type { Config } from 'payload'

import { describe, expect, it } from 'vitest'

import type { R2Bucket } from './types.js'

import { r2Storage } from './index.js'

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

describe('r2Storage when disabled', () => {
  it('should insert the prefix and object key fields when alwaysInsertFields is true', () => {
    const config = r2Storage({
      alwaysInsertFields: true,
      bucket: {} as R2Bucket,
      collections: {
        media: true,
      },
      enabled: false,
    })(createConfig()) as Config

    expect(getMediaFieldNames(config)).toEqual(expect.arrayContaining(['prefix', '_objectKey']))
  })

  it('should not insert fields when alwaysInsertFields is not set', () => {
    const config = r2Storage({
      bucket: {} as R2Bucket,
      collections: {
        media: true,
      },
      enabled: false,
    })(createConfig()) as Config

    expect(getMediaFieldNames(config)).toEqual([])
  })
})
