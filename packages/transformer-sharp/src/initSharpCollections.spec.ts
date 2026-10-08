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
  it('should not throw when the config has no collections', () => {
    const config = makeConfig(undefined)

    expect(() => initSharpCollections({ collections: {}, config })).not.toThrow()
  })

  it.each([
    { expected: { crop: false, focalPoint: false }, sharpConfig: {} },
    { expected: { crop: true, focalPoint: true }, sharpConfig: { crop: true, focalPoint: true } },
  ])(
    "should let Sharp's crop and focalPoint override the collection's only when set (%#)",
    ({ expected, sharpConfig }) => {
      const config = makeConfig([
        uploadCollection({ slug: 'media', upload: { crop: false, focalPoint: false } }),
      ])

      const result = initSharpCollections({ collections: { media: sharpConfig }, config })

      expect(result.collections?.[0]?.upload).toMatchObject(expected)
    },
  )

  it('should write variants onto a copy, leaving the caller config untouched', () => {
    const authoredCollection = uploadCollection({ slug: 'media', upload: { staticDir: 'media' } })
    const authoredCollections = [authoredCollection]
    const config = makeConfig(authoredCollections)

    const result = initSharpCollections({
      collections: { media: { variants: [{ name: 'thumbnail', width: 100 }] } },
      config,
    })

    expect(result.collections?.[0]?.upload).toMatchObject({
      variants: [{ name: 'thumbnail' }],
      staticDir: 'media',
    })
    expect(result).not.toBe(config)
    expect(result.collections?.[0]).not.toBe(authoredCollection)
    expect(config.collections).toBe(authoredCollections)
    expect(authoredCollection.upload).toEqual({ staticDir: 'media' })
  })

  it.each([
    { collection: uploadCollection({ slug: 'media' }), slug: 'missing' },
    { collection: uploadCollection({ slug: 'posts', upload: false }), slug: 'posts' },
  ])(
    'should throw when the configured collection "$slug" is missing or not upload-enabled',
    ({ collection, slug }) => {
      const config = makeConfig([collection])

      expect(() => initSharpCollections({ collections: { [slug]: {} }, config })).toThrow(
        new RegExp(`"${slug}"`),
      )
    },
  )

  it.each([
    {
      error: /duplicate/i,
      variants: [
        { name: 'square', width: 100 },
        { name: 'square', width: 200 },
      ],
    },
    { error: /reserved/i, variants: [{ name: 'filename', width: 100 }] },
    { error: /name/i, variants: [{ width: 100 }] },
  ])('should reject invalid variants ($error)', ({ error, variants }) => {
    const config = makeConfig([uploadCollection({ slug: 'media' })])

    expect(() =>
      initSharpCollections({
        collections: { media: { variants: variants as SharpCollectionConfig['variants'] } },
        config,
      }),
    ).toThrow(error)
  })

  it('should allow a variants entry with neither width nor height (format-only/pass-through size)', () => {
    const config = makeConfig([uploadCollection({ slug: 'media' })])

    expect(() =>
      initSharpCollections({
        collections: { media: { variants: [{ name: 'noDimensions' }] } },
        config,
      }),
    ).not.toThrow()
  })
})
