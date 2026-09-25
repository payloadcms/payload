import type { Config } from 'payload'

import { describe, expect, it } from 'vitest'

import type { SharpCollectionConfig } from './types.js'

import { initSharpCollections } from './initSharpCollections.js'

const makeConfig = (collections: Config['collections']): Config =>
  ({
    collections,
  }) as unknown as Config

const uploadCollection = ({
  slug,
  upload = {},
}: {
  slug: string
  upload?: boolean | Record<string, unknown>
}) => ({ slug, upload }) as unknown as NonNullable<Config['collections']>[number]

describe('initSharpCollections', () => {
  it('should throw when a configured collection slug does not exist in the config', () => {
    const config = makeConfig([uploadCollection({ slug: 'media' })])

    expect(() =>
      initSharpCollections({
        collections: { missing: {} },
        config,
      }),
    ).toThrow(/"missing"/)
  })

  it('should throw when a configured collection is not upload-enabled', () => {
    const config = makeConfig([uploadCollection({ slug: 'posts', upload: false })])

    expect(() =>
      initSharpCollections({
        collections: { posts: {} },
        config,
      }),
    ).toThrow(/"posts"/)
  })

  it('should throw when imageSizes has a duplicate name', () => {
    const config = makeConfig([uploadCollection({ slug: 'media' })])

    expect(() =>
      initSharpCollections({
        collections: {
          media: {
            imageSizes: [
              { name: 'square', width: 100 },
              { name: 'square', width: 200 },
            ],
          },
        },
        config,
      }),
    ).toThrow(/duplicate/i)
  })

  it('should throw when an imageSizes entry uses a reserved field name', () => {
    const config = makeConfig([uploadCollection({ slug: 'media' })])

    expect(() =>
      initSharpCollections({
        collections: {
          media: {
            imageSizes: [{ name: 'filename', width: 100 }],
          },
        },
        config,
      }),
    ).toThrow(/reserved/i)
  })

  it('should allow an imageSizes entry with neither width nor height (format-only/pass-through size)', () => {
    const config = makeConfig([uploadCollection({ slug: 'media' })])

    expect(() =>
      initSharpCollections({
        collections: {
          media: {
            imageSizes: [{ name: 'noDimensions' }],
          },
        },
        config,
      }),
    ).not.toThrow()
  })

  it('should throw when an imageSizes entry is missing a name', () => {
    const config = makeConfig([uploadCollection({ slug: 'media' })])

    expect(() =>
      initSharpCollections({
        collections: {
          media: {
            imageSizes: [{ width: 100 }] as unknown as SharpCollectionConfig['imageSizes'],
          },
        },
        config,
      }),
    ).toThrow(/name/i)
  })
})
