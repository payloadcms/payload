import type { Config, UploadCollectionSlug } from 'payload'

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
    expect(sharpTransformer().mimeTypes).not.toContain('image/jxl')
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
