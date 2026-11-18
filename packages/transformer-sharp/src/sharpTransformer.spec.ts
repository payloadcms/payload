import type { CanTransformArgs, Config, PayloadRequest, UploadCollectionSlug } from 'payload'

import { describe, expect, it } from 'vitest'

import { resolveSharpDynamicDefaults, sharpTransformer } from './sharpTransformer.js'

describe('sharpTransformer', () => {
  it("should default mimeTypes to canResizeImage's allow-list exactly, excluding jxl", () => {
    expect(sharpTransformer().mimeTypes).toEqual([
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/tiff',
      'image/avif',
    ])
  })

  it('should claim crop and focalPoint at upload time', async () => {
    const args = getUploadArgs({})

    expect(await sharpTransformer().canTransform!(args)).toEqual({
      canTransform: true,
      handledTransformKeys: ['crop', 'focalPoint'],
    })
  })

  it('should skip an upload to a collection whose variants another transformer registered', async () => {
    const args = getUploadArgs({ variantsTransformerSlug: 'figma' })

    expect(await sharpTransformer().canTransform!(args)).toBe(false)
  })

  it('should claim an upload to a collection whose variants it registered', async () => {
    const args = getUploadArgs({ variantsTransformerSlug: 'sharp' })

    expect(await sharpTransformer().canTransform!(args)).toEqual({
      canTransform: true,
      handledTransformKeys: ['crop', 'focalPoint'],
    })
  })

  it('should claim an upload to a collection it has settings for, even when another transformer registered its variants', async () => {
    const args = getUploadArgs({ variantsTransformerSlug: 'figma' })
    const transformer = sharpTransformer({ collections: { media: { crop: true } } })

    expect(await transformer.canTransform!(args)).toEqual({
      canTransform: true,
      handledTransformKeys: ['crop', 'focalPoint'],
    })
  })

  it('should not resize in the saved-state phase of a request', async () => {
    const result = await sharpTransformer({ dynamic: true }).canTransform!({
      collectionSlug: 'media',
      doc: {},
      mimeType: 'image/png',
      operation: 'request',
      originalDoc: {},
      purpose: 'persisted-default',
      req: { searchParams: new URLSearchParams('width=10') } as never,
    })

    expect(result).toBe(false)
  })

  it('should reject dynamic.collections that are unknown or not upload-enabled on init', () => {
    const config = {
      collections: [
        { slug: 'media', fields: [], upload: true },
        { slug: 'posts', fields: [] },
      ],
    } as unknown as Config
    const transformer = sharpTransformer({
      dynamic: { collections: ['posts', 'missing'] as unknown as UploadCollectionSlug[] },
    })

    expect(() => transformer.init!(config)).toThrow(
      /not an upload-enabled collection: "posts", "missing"/,
    )
  })

  it('should reject a collection whose upload settings are configured on more than one instance on init', () => {
    const first = sharpTransformer({ collections: { media: { variants: [] } } })
    const second = sharpTransformer({ slug: 'sharp-second', collections: { media: {} } })
    const config = {
      collections: [{ slug: 'media', fields: [], upload: true }],
      upload: { transformers: [first, second] },
    } as unknown as Config

    expect(() => second.init!(config)).toThrow(
      /"media" has upload settings on more than one Sharp transformer: "sharp", "sharp-second"/,
    )
  })

  it('should allow different collections configured on different instances', () => {
    const first = sharpTransformer({ collections: { media: {} } })
    const second = sharpTransformer({ slug: 'sharp-second', collections: { photos: {} } })
    const config = {
      collections: [
        { slug: 'media', fields: [], upload: true },
        { slug: 'photos', fields: [], upload: true },
      ],
      upload: { transformers: [first, second] },
    } as unknown as Config

    expect(() => second.init!(config)).not.toThrow()
  })
})

function getUploadArgs({
  variantsTransformerSlug,
}: {
  variantsTransformerSlug?: string
}): CanTransformArgs {
  const req = {
    payload: { collections: { media: { config: { upload: { variantsTransformerSlug } } } } },
  } as unknown as PayloadRequest

  return {
    collectionSlug: 'media',
    doc: {},
    mimeType: 'image/png',
    operation: 'upload',
    originalDoc: {},
    req,
  }
}

describe('resolveSharpDynamicDefaults', () => {
  it('should default to fit=cover, position=center, maxWidth=4096, maxHeight=4096, maxPixels=16_777_216, withoutEnlargement=false', () => {
    expect(resolveSharpDynamicDefaults()).toEqual({
      fit: 'cover',
      maxHeight: 4096,
      maxPixels: 16_777_216,
      maxWidth: 4096,
      position: 'center',
      withoutEnlargement: false,
    })
  })
})
