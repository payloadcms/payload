import type { Config, PayloadRequest, UploadCollectionSlug } from 'payload'

import { describe, expect, it } from 'vitest'

import { cloudinaryTransformer } from './cloudinaryTransformer.js'

const url = 'cloudinary://key:secret@my-cloud'

const makeCanTransformArgs = (query = '') => ({
  collectionSlug: 'media',
  mimeType: 'image/png',
  operation: 'request' as const,
  req: { searchParams: new URLSearchParams(query) } as unknown as PayloadRequest,
})

describe('cloudinaryTransformer', () => {
  describe('canTransform', () => {
    it('should not route resize requests by default', async () => {
      const transformer = cloudinaryTransformer({ url })
      await expect(
        Promise.resolve(transformer.canTransform!(makeCanTransformArgs('width=500'))),
      ).resolves.toBe(false)
    })

    it('should not route resize requests when dynamic is false', async () => {
      const transformer = cloudinaryTransformer({ dynamic: false, url })
      await expect(
        Promise.resolve(transformer.canTransform!(makeCanTransformArgs('width=500'))),
      ).resolves.toBe(false)
    })

    it('should route resize requests when dynamic is true', async () => {
      const transformer = cloudinaryTransformer({ dynamic: true, url })
      await expect(
        Promise.resolve(transformer.canTransform!(makeCanTransformArgs('width=500'))),
      ).resolves.toBe(true)
    })

    it('should not route requests without a recognized parameter when dynamic is true', async () => {
      const transformer = cloudinaryTransformer({ dynamic: true, url })
      await expect(
        Promise.resolve(transformer.canTransform!(makeCanTransformArgs('draft=true'))),
      ).resolves.toBe(false)
    })

    it('should route resize requests only for collections listed in dynamic.collections', async () => {
      const transformer = cloudinaryTransformer({ dynamic: { collections: ['media'] }, url })
      await expect(
        Promise.resolve(transformer.canTransform!(makeCanTransformArgs('width=500'))),
      ).resolves.toBe(true)
      await expect(
        Promise.resolve(
          transformer.canTransform!({
            ...makeCanTransformArgs('width=500'),
            collectionSlug: 'docs',
          }),
        ),
      ).resolves.toBe(false)
    })

    it('should always be eligible for the upload operation', async () => {
      const transformer = cloudinaryTransformer({ url })
      await expect(
        Promise.resolve(
          transformer.canTransform!({ ...makeCanTransformArgs(), operation: 'upload' }),
        ),
      ).resolves.toBe(true)
    })
  })

  describe('init', () => {
    const makeConfig = () =>
      ({
        collections: [
          { slug: 'media', fields: [], upload: true },
          { slug: 'posts', fields: [] },
        ],
      }) as unknown as Config

    it('should accept dynamic.collections that are upload-enabled', async () => {
      const transformer = cloudinaryTransformer({ dynamic: { collections: ['media'] }, url })
      await expect(Promise.resolve(transformer.init!(makeConfig()))).resolves.toBeDefined()
    })

    it('should reject dynamic.collections that are unknown or not upload-enabled', () => {
      const transformer = cloudinaryTransformer({
        dynamic: { collections: ['posts', 'missing'] as unknown as UploadCollectionSlug[] },
        url,
      })
      expect(() => transformer.init!(makeConfig())).toThrow(
        /not an upload-enabled collection: "posts", "missing"/,
      )
    })
  })
})
