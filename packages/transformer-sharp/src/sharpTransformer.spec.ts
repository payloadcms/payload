import type { Config, UploadCollectionSlug } from 'payload'

import { describe, expect, it } from 'vitest'

import { resolveSharpDynamicDefaults, sharpTransformer } from './sharpTransformer.js'

describe('sharpTransformer', () => {
  it.each([0, -1, Infinity, 1.5])('should reject invalid saved resource limits %s', (maxPixels) => {
    expect(() => sharpTransformer({ transformLimits: { maxPixels } })).toThrow(
      'positive safe integers',
    )
  })

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
