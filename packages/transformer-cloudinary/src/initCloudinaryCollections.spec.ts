import type { Config } from 'payload'

import { describe, expect, it } from 'vitest'

import { initCloudinaryCollections } from './initCloudinaryCollections.js'

const createConfig = (): Config =>
  ({
    collections: [
      { slug: 'media', fields: [], upload: true },
      { slug: 'posts', fields: [] },
    ],
  }) as Config

describe('initCloudinaryCollections', () => {
  it('should project image sizes onto the collection upload config', () => {
    const config = createConfig()

    initCloudinaryCollections({
      collections: {
        media: {
          crop: true,
          focalPoint: true,
          imageSizes: [{ name: 'square', height: 400, width: 400 }],
        },
      },
      config,
    })

    const media = config.collections![0]!

    expect(media.upload).toMatchObject({
      crop: true,
      focalPoint: true,
      imageSizes: [{ name: 'square', admin: undefined, generateImageName: undefined }],
    })
  })

  it('should flag configured adjustments for the Admin Panel', () => {
    const config = createConfig()

    initCloudinaryCollections({
      collections: { media: { resizeOptions: { width: 2048 } } },
      config,
    })

    expect(config.collections![0]!.upload).toMatchObject({ hasImageAdjustments: true })
  })

  it('should reject an unknown collection slug', () => {
    expect(() =>
      initCloudinaryCollections({ collections: { unknown: {} }, config: createConfig() }),
    ).toThrow(/does not match any configured collection slug/)
  })

  it('should reject a collection without uploads enabled', () => {
    expect(() =>
      initCloudinaryCollections({ collections: { posts: {} }, config: createConfig() }),
    ).toThrow(/`upload` option is not set/)
  })

  it('should reject duplicate and reserved image size names', () => {
    expect(() =>
      initCloudinaryCollections({
        collections: {
          media: {
            imageSizes: [
              { name: 'square', width: 1 },
              { name: 'square', width: 2 },
              { name: 'url' },
            ],
          },
        },
        config: createConfig(),
      }),
    ).toThrow(/duplicate size name: "square"[\s\S]*reserved name "url"/)
  })
})
