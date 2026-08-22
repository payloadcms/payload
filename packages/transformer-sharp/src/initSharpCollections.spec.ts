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

  it('should write back a narrowed imageSizes array containing only name, admin, and generateImageName', () => {
    const generateImageName = () => 'custom-name'
    const collection = uploadCollection({ slug: 'media' })
    const config = makeConfig([collection])

    initSharpCollections({
      collections: {
        media: {
          imageSizes: [
            {
              name: 'square',
              admin: { disabled: { column: true } },
              crop: 'center',
              formatOptions: { format: 'png' },
              generateImageName,
              height: 400,
              width: 400,
            },
          ],
        },
      },
      config,
    })

    const upload = collection.upload as Record<string, unknown>

    expect(upload.imageSizes).toEqual([
      {
        name: 'square',
        admin: { disabled: { column: true } },
        generateImageName,
      },
    ])
  })

  it('should write back crop and focalPoint booleans', () => {
    const collection = uploadCollection({ slug: 'media' })
    const config = makeConfig([collection])

    initSharpCollections({
      collections: {
        media: {
          crop: false,
          focalPoint: false,
        },
      },
      config,
    })

    const upload = collection.upload as Record<string, unknown>

    expect(upload.crop).toBe(false)
    expect(upload.focalPoint).toBe(false)
  })

  it.each([
    ['resizeOptions', { resizeOptions: { width: 200 } }],
    ['formatOptions', { formatOptions: { format: 'png' } }],
    ['trimOptions', { trimOptions: { threshold: 10 } }],
    ['constructorOptions', { constructorOptions: { limitInputPixels: 100 } }],
    ['withMetadata', { withMetadata: true }],
  ])(
    'should write back hasImageAdjustments as true when %s is configured',
    (_label, sharpConfig) => {
      const collection = uploadCollection({ slug: 'media' })
      const config = makeConfig([collection])

      initSharpCollections({
        collections: { media: sharpConfig as SharpCollectionConfig },
        config,
      })

      expect((collection.upload as Record<string, unknown>).hasImageAdjustments).toBe(true)
    },
  )

  it('should write back hasImageAdjustments as false when no main-image adjustment fields are configured', () => {
    const collection = uploadCollection({ slug: 'media' })
    const config = makeConfig([collection])

    initSharpCollections({
      collections: { media: { imageSizes: [{ name: 'square', width: 400 }] } },
      config,
    })

    expect((collection.upload as Record<string, unknown>).hasImageAdjustments).toBe(false)
  })

  it('should not modify an unconfigured collection', () => {
    const untouchedUpload = { imageSizes: [{ name: 'existing', width: 1 }] }
    const collection = uploadCollection({ slug: 'other', upload: untouchedUpload })
    const config = makeConfig([uploadCollection({ slug: 'media' }), collection])

    initSharpCollections({
      collections: { media: {} },
      config,
    })

    expect(collection.upload).toBe(untouchedUpload)
  })

  it('should convert a boolean upload: true shorthand into an object before writing back', () => {
    const collection = uploadCollection({ slug: 'media', upload: true })
    const config = makeConfig([collection])

    initSharpCollections({
      collections: { media: { crop: true } },
      config,
    })

    expect(collection.upload).toEqual({
      crop: true,
      focalPoint: undefined,
      hasImageAdjustments: false,
      imageSizes: undefined,
    })
  })

  it('should produce the same result when run twice (idempotent)', () => {
    const collection = uploadCollection({ slug: 'media' })
    const config = makeConfig([collection])
    const sharpConfig: Record<string, SharpCollectionConfig> = {
      media: { imageSizes: [{ name: 'square', width: 400 }], resizeOptions: { width: 200 } },
    }

    initSharpCollections({ collections: sharpConfig, config })
    const firstResult = JSON.stringify(collection.upload)

    initSharpCollections({ collections: sharpConfig, config })
    const secondResult = JSON.stringify(collection.upload)

    expect(secondResult).toBe(firstResult)
  })

  it('should return the same config reference', () => {
    const config = makeConfig([uploadCollection({ slug: 'media' })])

    expect(initSharpCollections({ collections: {}, config })).toBe(config)
  })
})
