import type { Config, UploadCollectionSlug } from 'payload'

import { describe, expect, it } from 'vitest'
import sharp from 'sharp'

import { resolveSharpDynamicDefaults, sharpTransformer } from './sharpTransformer.js'
import { DEFAULT_MAX_INPUT_PIXELS } from './types.js'

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
    const args = { collectionSlug: 'media', mimeType: 'image/png', operation: 'upload' } as const

    expect(await sharpTransformer().canTransform!(args as never)).toEqual({
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

  it("should apply the collection's maxInputPixels to dynamic resizes", async () => {
    // 2000x2000 is 4,000,000 pixels — within the 50M global cap but over the
    // media collection's 1,000,000 cap.
    const sourceBuffer = await sharp({
      create: { background: { b: 0, g: 128, r: 255 }, channels: 3, height: 2000, width: 2000 },
    })
      .png()
      .toBuffer()
    const transformer = sharpTransformer({
      collections: { media: { maxInputPixels: 1_000_000 } },
      dynamic: true,
    })

    const result = await transformer.handleRequest!({
      collectionSlug: 'media',
      documentID: '1',
      filename: 'photo.png',
      getSourceFile: async () => new Response(sourceBuffer),
      mimeType: 'image/png',
      req: {
        headers: new Headers(),
        method: 'GET',
        searchParams: new URLSearchParams('width=100'),
      },
    } as never)

    expect(result.response?.status).toBe(400)
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

describe('DEFAULT_MAX_INPUT_PIXELS', () => {
  it("should default to 50,000,000 — well under Sharp's 268,435,456 default, while still accepting 48 MP phone sensors", () => {
    expect(DEFAULT_MAX_INPUT_PIXELS).toBe(50_000_000)
  })
})
