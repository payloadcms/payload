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
  it("should keep the collection's crop and focalPoint when Sharp doesn't set them", () => {
    const config = makeConfig([
      uploadCollection({ slug: 'media', upload: { crop: false, focalPoint: false } }),
    ])

    const result = initSharpCollections({ collections: { media: {} }, config })

    expect(result.collections?.[0]?.upload).toMatchObject({ crop: false, focalPoint: false })
  })

  it("should let Sharp's crop and focalPoint override the collection's", () => {
    const config = makeConfig([
      uploadCollection({ slug: 'media', upload: { crop: false, focalPoint: false } }),
    ])

    const result = initSharpCollections({
      collections: { media: { crop: true, focalPoint: true } },
      config,
    })

    expect(result.collections?.[0]?.upload).toMatchObject({ crop: true, focalPoint: true })
  })

  it('should write variants as imageSizes onto a copy, leaving the authored collection untouched', () => {
    const authoredUpload = { staticDir: 'media' }
    const authoredCollection = uploadCollection({ slug: 'media', upload: authoredUpload })
    const config = makeConfig([authoredCollection])

    const result = initSharpCollections({
      collections: { media: { variants: [{ name: 'thumbnail', width: 100 }] } },
      config,
    })

    expect(result.collections?.[0]?.upload).toMatchObject({
      imageSizes: [{ name: 'thumbnail' }],
      staticDir: 'media',
    })
    expect(authoredUpload).toEqual({ staticDir: 'media' })
    expect(result.collections?.[0]).not.toBe(authoredCollection)
  })

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

  it('should throw when variants has a duplicate name', () => {
    const config = makeConfig([uploadCollection({ slug: 'media' })])

    expect(() =>
      initSharpCollections({
        collections: {
          media: {
            variants: [
              { name: 'square', width: 100 },
              { name: 'square', width: 200 },
            ],
          },
        },
        config,
      }),
    ).toThrow(/duplicate/i)
  })

  it('should throw when a variants entry uses a reserved field name', () => {
    const config = makeConfig([uploadCollection({ slug: 'media' })])

    expect(() =>
      initSharpCollections({
        collections: {
          media: {
            variants: [{ name: 'filename', width: 100 }],
          },
        },
        config,
      }),
    ).toThrow(/reserved/i)
  })

  it('should allow a variants entry with neither width nor height (format-only/pass-through size)', () => {
    const config = makeConfig([uploadCollection({ slug: 'media' })])

    expect(() =>
      initSharpCollections({
        collections: {
          media: {
            variants: [{ name: 'noDimensions' }],
          },
        },
        config,
      }),
    ).not.toThrow()
  })

  it('should throw when a variants entry is missing a name', () => {
    const config = makeConfig([uploadCollection({ slug: 'media' })])

    expect(() =>
      initSharpCollections({
        collections: {
          media: {
            variants: [{ width: 100 }] as unknown as SharpCollectionConfig['variants'],
          },
        },
        config,
      }),
    ).toThrow(/name/i)
  })
})
