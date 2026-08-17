import type { PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { resolveSharpDynamicDefaults, sharpTransformer } from './sharpTransformer.js'

const makeReq = (query = ''): PayloadRequest =>
  ({
    searchParams: new URLSearchParams(query),
  }) as unknown as PayloadRequest

const makeCanTransformArgs = (query = '') => ({
  collectionSlug: 'media',
  mimeType: 'image/png',
  operation: 'request' as const,
  req: makeReq(query),
})

describe('sharpTransformer', () => {
  it('should default the slug to "sharp"', () => {
    expect(sharpTransformer().slug).toBe('sharp')
  })

  it('should preserve a custom slug', () => {
    expect(sharpTransformer({ slug: 'product-images' }).slug).toBe('product-images')
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
    expect(sharpTransformer().mimeTypes).not.toContain('image/jxl')
  })

  it('should not throw when constructed with no arguments (bundled Sharp)', () => {
    expect(() => sharpTransformer()).not.toThrow()
  })

  it('should not throw when constructed with an injected Sharp instance', () => {
    const fakeSharp = vi.fn() as never
    expect(() => sharpTransformer({ sharp: fakeSharp })).not.toThrow()
  })

  describe('canTransform', () => {
    it('should return false when no recognized dynamic parameter is present', async () => {
      const transformer = sharpTransformer()
      await expect(
        Promise.resolve(transformer.canTransform!(makeCanTransformArgs())),
      ).resolves.toBe(false)
    })

    it('should return true for a valid resize request', async () => {
      const transformer = sharpTransformer()
      await expect(
        Promise.resolve(transformer.canTransform!(makeCanTransformArgs('width=500'))),
      ).resolves.toBe(true)
    })

    it('should return true for an invalid/malformed resize request, deferring the 400 to handleRequest', async () => {
      const transformer = sharpTransformer()
      await expect(
        Promise.resolve(transformer.canTransform!(makeCanTransformArgs('width=not-a-number'))),
      ).resolves.toBe(true)
    })

    it('should ignore unrelated query keys', async () => {
      const transformer = sharpTransformer()
      await expect(
        Promise.resolve(transformer.canTransform!(makeCanTransformArgs('draft=true&depth=1'))),
      ).resolves.toBe(false)
    })

    it('should treat a request with no searchParams as not routed', async () => {
      const transformer = sharpTransformer()
      const args = {
        ...makeCanTransformArgs(),
        req: {} as PayloadRequest,
      }
      await expect(Promise.resolve(transformer.canTransform!(args))).resolves.toBe(false)
    })

    it('should validate against configured custom dynamic.maxWidth', async () => {
      const transformer = sharpTransformer({ dynamic: { maxWidth: 100 } })
      // Still routed (true) either way — validity is decided by handleRequest, not canTransform.
      await expect(
        Promise.resolve(transformer.canTransform!(makeCanTransformArgs('width=200'))),
      ).resolves.toBe(true)
    })

    it('should always be eligible for the upload operation, regardless of query params', async () => {
      const transformer = sharpTransformer()
      await expect(
        Promise.resolve(
          transformer.canTransform!({ ...makeCanTransformArgs(), operation: 'upload' }),
        ),
      ).resolves.toBe(true)
    })
  })

  it('should expose a transformFile capability', () => {
    expect(typeof sharpTransformer().transformFile).toBe('function')
  })

  it('should attach the private v4 upload compatibility bridge', async () => {
    const { uploadTransformerInternal } = await import('payload/internal')
    const transformer = sharpTransformer() as unknown as Record<symbol, unknown>
    const bridge = transformer[uploadTransformerInternal] as { prepareUpload?: unknown }

    expect(typeof bridge?.prepareUpload).toBe('function')
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

  it('should let each default be overridden independently', () => {
    expect(resolveSharpDynamicDefaults({ maxWidth: 200, withoutEnlargement: true })).toEqual({
      fit: 'cover',
      maxHeight: 4096,
      maxPixels: 16_777_216,
      maxWidth: 200,
      position: 'center',
      withoutEnlargement: true,
    })
  })
})
