import type { Config, Document, PayloadRequest, UploadTransformer } from 'payload'

import sharp from 'sharp'
import { describe, expect, it, vi } from 'vitest'

import { getUploadTransformerInternal } from 'payload/internal'

import { cloudflareTransformer } from './cloudflareTransformer.js'
import { createCloudflareImagesHandler } from './worker.js'
import { createFileSource } from '../../payload/src/uploads/transformers/createFileSource.js'
import { transformUploadFile } from '../../payload/src/uploads/transformers/transformUploadFile.js'
import { finalizeFileResponse } from '../../payload/src/uploads/transformers/finalizeFileResponse.js'

// Only the external Images service is substituted. Real bytes, Request/Response,
// File streams, remote protocol, upload planning, and Payload's pipeline all run.
function createImages() {
  const info = vi.fn(async (stream: ReadableStream<Uint8Array>) => {
    const bytes = Buffer.from(await new Response(stream).arrayBuffer())
    const metadata = await sharp(bytes).metadata()

    return {
      fileSize: bytes.length,
      format: `image/${metadata.format}`,
      height: metadata.height!,
      width: metadata.width!,
    }
  })
  const transformOptions: Record<string, any>[] = []
  const input = vi.fn((stream: ReadableStream<Uint8Array>) => {
    const transforms: Record<string, any>[] = []
    const handle = {
      transform: (options: Record<string, any>) => {
        transforms.push(options)
        transformOptions.push(options)
        return handle
      },
      output: async (options: { format: string; quality?: number }) => {
        let bytes = Buffer.from(await new Response(stream).arrayBuffer())

        for (const transform of transforms) {
          let image = sharp(bytes)

          if (transform.trim && typeof transform.trim === 'object') {
            const metadata = await image.metadata()
            const left = transform.trim.left ?? 0
            const top = transform.trim.top ?? 0

            // Cloudflare trim.width/height are coordinates from the original
            // left/top edge, not extract rectangle sizes.
            image = image.extract({
              left,
              top,
              width: (transform.trim.width ?? metadata.width! - (transform.trim.right ?? 0)) - left,
              height:
                (transform.trim.height ?? metadata.height! - (transform.trim.bottom ?? 0)) - top,
            })
          }
          if (transform.width || transform.height) {
            image = image.resize({
              width: transform.width,
              height: transform.height,
              fit:
                transform.fit === 'crop'
                  ? 'cover'
                  : transform.fit === 'scale-down'
                    ? 'inside'
                    : (transform.fit ?? 'cover'),
              withoutEnlargement: ['crop', 'scale-down'].includes(transform.fit),
            })
          }
          bytes = await image.toBuffer()
        }
        const bytesOut = await sharp(bytes)
          .toFormat(options.format.slice(6) as 'png', { quality: options.quality })
          .toBuffer()

        return {
          response: () => new Response(bytesOut, { headers: { 'Content-Type': options.format } }),
        }
      },
    }

    return handle
  })

  return { info, input, transformOptions }
}

async function imageFile({ width = 800, height = 600 } = {}) {
  const bytes = await sharp({ create: { width, height, channels: 3, background: '#e00000' } })
    .png()
    .toBuffer()

  return new File([bytes], 'photo.png', { type: 'image/png' })
}

function request({ query = '', method = 'GET', headers = {} } = {}): PayloadRequest {
  return {
    headers: new Headers(headers),
    method,
    searchParams: new URLSearchParams(query),
    payload: { collections: { media: { config: { upload: {} } } }, config: {} },
  } as unknown as PayloadRequest
}

function config({ transformers = [] }: { transformers?: UploadTransformer[] } = {}): Config {
  return {
    collections: [{ slug: 'media', fields: [], upload: true }],
    upload: { transformers },
  } as unknown as Config
}

function initWith({ transformer }: { transformer: UploadTransformer }): Config {
  return transformer.init!(config({ transformers: [transformer] })) as Config
}

function canTransformArgs({
  collectionSlug = 'media',
  operation,
  purpose,
  req = request(),
}: {
  collectionSlug?: string
  operation: 'request' | 'upload'
  purpose?: 'persisted-default' | 'request-override'
  req?: PayloadRequest
}) {
  return {
    collectionSlug,
    doc: {},
    mimeType: 'image/png',
    operation,
    originalDoc: {},
    purpose,
    req,
  }
}

function transformFileArgs({ file, req = request() }: { file: File; req?: PayloadRequest }) {
  return {
    collectionSlug: 'media',
    doc: {},
    file,
    options: undefined,
    originalDoc: {},
    originalSource: createFileSource({ file }),
    req,
    source: createFileSource({ file }),
  }
}

/** Runs Payload's real stage pipeline, as core does for one upload task. */
function runPipeline({
  doc = {},
  file,
  options,
  req,
  transformer,
}: {
  doc?: Document
  file: File
  options?: unknown
  req: PayloadRequest
  transformer: UploadTransformer
}) {
  return transformUploadFile({
    claims: new Map(),
    collectionSlug: 'media',
    doc,
    file,
    getOptions: () => options,
    originalDoc: doc,
    originalFile: file,
    pipeline: [transformer],
    req,
  })
}

/** Runs the upload bridge, as core does, with each task going through the real stage pipeline. */
function runTransformUpload({
  cropSize,
  doc = {},
  file,
  req = request(),
  transformer,
}: {
  cropSize?: { height: number; width: number }
  doc?: Document
  file: File
  req?: PayloadRequest
  transformer: UploadTransformer
}) {
  return getUploadTransformerInternal(transformer)!.transformUpload!({
    collectionSlug: 'media',
    cropSize,
    file,
    req,
    transform: (task) =>
      runPipeline({ doc, file: task.file ?? file, options: task.options, req, transformer }),
  })
}

async function dimensions(response: Response | File) {
  const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata()

  return { height: metadata.height, width: metadata.width }
}

function dynamicArgs({
  file,
  req,
  getSourceFile = vi.fn(async () => new Response(file.stream())),
}: {
  file: File
  req: PayloadRequest
  getSourceFile?: () => Promise<Response>
}) {
  return {
    collectionSlug: 'media',
    doc: {},
    documentID: '1',
    filename: file.name,
    getOriginalFile: getSourceFile,
    getSourceFile,
    mimeType: file.type,
    options: undefined,
    originalDoc: {},
    req,
  }
}

describe('Cloudflare transformer transports', () => {
  it.each(['binding', 'remote'] as const)(
    'should resize authenticated source bytes with the %s transport',
    async (mode) => {
      const binding = createImages()
      const handler = createCloudflareImagesHandler({ binding, token: 'worker-secret' })
      const fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) =>
        handler(new Request(url, init)),
      )
      const transformer = cloudflareTransformer({
        transport:
          mode === 'binding'
            ? { mode, binding }
            : { mode, url: 'https://images.example.com', token: 'worker-secret', fetch },
        dynamic: true,
      })
      const file = await imageFile()
      const result = await transformer.handleRequest!(
        dynamicArgs({ file, req: request({ query: 'width=200&height=150' }) }),
      )

      expect(result.status).toBe('continue')
      expect(await dimensions(result.response!)).toEqual({ height: 150, width: 200 })
      expect(result.response!.headers.get('cache-control')).toBe('private, no-store')
      if (mode === 'remote') {
        expect(fetch).toHaveBeenCalled()
        expect(String(fetch.mock.calls[0]![0])).not.toContain('photo.png')
      }
    },
  )

  it('should reject an unauthenticated remote request before processing its body', async () => {
    const binding = createImages()
    const handler = createCloudflareImagesHandler({ binding, token: 'worker-secret' })
    const response = await handler(
      new Request('https://images.example.com', { method: 'POST', body: 'bad input' }),
    )

    expect(response.status).toBe(401)
    expect(binding.input).not.toHaveBeenCalled()
    expect(binding.info).not.toHaveBeenCalled()
  })

  it('should fail at startup for insecure remote transport settings', () => {
    expect(() =>
      cloudflareTransformer({
        transport: { mode: 'remote', url: 'http://images.example.com', token: 'secret' },
      }),
    ).toThrow()
    expect(() =>
      cloudflareTransformer({
        transport: { mode: 'remote', url: 'https://images.example.com', token: '' },
      }),
    ).toThrow()
  })

  it('should propagate a remote failure without exposing the token or response body', async () => {
    const transformer = cloudflareTransformer({
      transport: {
        mode: 'remote',
        url: 'https://images.example.com',
        token: 'secret',
        fetch: async () => new Response('private details', { status: 500 }),
      },
      collections: { media: { resizeOptions: { width: 100 } } },
    })
    const file = await imageFile()

    await expect(transformer.transformFile!(transformFileArgs({ file }))).rejects.toThrow(
      'Cloudflare Images request failed (500)',
    )
  })
})

describe('Cloudflare dynamic requests', () => {
  it.each([
    'width=0',
    'width=20&width=30',
    'height=1e3',
    'withoutEnlargement=true',
    'width=5000',
    'width=100&height=100',
  ])(
    'should reject invalid or excessive dimensions (%s) before reading the source',
    async (query) => {
      const binding = createImages()
      const transformer = cloudflareTransformer({
        transport: { mode: 'binding', binding },
        dynamic: { maxPixels: 9000 },
      })
      const file = await imageFile()
      const getSourceFile = vi.fn()
      const result = await transformer.handleRequest!(
        dynamicArgs({ file, getSourceFile, req: request({ query }) }),
      )

      expect(result.response!.status).toBe(400)
      expect(getSourceFile).not.toHaveBeenCalled()
      expect(binding.input).not.toHaveBeenCalled()
    },
  )

  it('should enforce the output limit when a single dimension implies an excessive other dimension', async () => {
    const binding = createImages()
    const transformer = cloudflareTransformer({
      transport: { mode: 'binding', binding },
      dynamic: { maxHeight: 1000 },
    })
    const file = await imageFile({ width: 10, height: 200 })
    const result = await transformer.handleRequest!(
      dynamicArgs({ file, req: request({ query: 'width=100' }) }),
    )

    expect(result.response!.status).toBe(400)
    expect(binding.input).not.toHaveBeenCalled()
  })

  it('should leave ordinary requests and disabled collections unrouted', () => {
    const transformer = cloudflareTransformer({
      transport: { mode: 'binding', binding: createImages() },
      dynamic: { collections: ['media'] },
    })
    expect(transformer.canTransform!(canTransformArgs({ operation: 'request' }))).toBe(false)
    expect(
      transformer.canTransform!(
        canTransformArgs({
          collectionSlug: 'other',
          operation: 'request',
          req: request({ query: 'width=100' }),
        }),
      ),
    ).toBe(false)
  })

  it('should disable dynamic transformation by default', () => {
    const transformer = cloudflareTransformer({
      transport: { mode: 'binding', binding: createImages() },
    })

    expect(
      transformer.canTransform!(
        canTransformArgs({ operation: 'request', req: request({ query: 'width=100' }) }),
      ),
    ).toBe(false)
  })

  it.each([
    { expected: false, purpose: 'persisted-default' as const },
    { expected: true, purpose: 'request-override' as const },
  ])(
    'should route only request parameters, not saved transforms, in the $purpose phase',
    ({ expected, purpose }) => {
      const transformer = cloudflareTransformer({
        transport: { mode: 'binding', binding: createImages() },
        dynamic: true,
      })

      expect(
        transformer.canTransform!(
          canTransformArgs({ operation: 'request', purpose, req: request({ query: 'width=100' }) }),
        ),
      ).toBe(expected)
    },
  )

  it('should preserve source errors without calling Images', async () => {
    const binding = createImages()
    const transformer = cloudflareTransformer({
      transport: { mode: 'binding', binding },
      dynamic: true,
    })
    const file = await imageFile()
    const source = new Response(null, { status: 404 })
    const result = await transformer.handleRequest!(
      dynamicArgs({
        file,
        req: request({ query: 'width=100' }),
        getSourceFile: async () => source,
      }),
    )

    expect(result.response).toBe(source)
    expect(binding.input).not.toHaveBeenCalled()
  })

  it('should retain HEAD response bytes for later stages and let Payload strip the final body', async () => {
    const first = cloudflareTransformer({
      slug: 'first',
      transport: { mode: 'binding', binding: createImages() },
      dynamic: { format: 'webp' },
    })
    const second = cloudflareTransformer({
      slug: 'second',
      transport: { mode: 'binding', binding: createImages() },
      dynamic: { format: 'jpeg' },
    })
    const file = await imageFile()
    const req = request({ method: 'HEAD', query: 'width=100' })

    req.payload.config = { cors: [] } as never
    const initial = await first.handleRequest!(dynamicArgs({ file, req }))
    const result = await second.handleRequest!(
      dynamicArgs({ file, req, getSourceFile: async () => initial.response! }),
    )
    const final = finalizeFileResponse({
      collection: { config: { upload: {} } } as never,
      req,
      response: result.response!,
    })

    expect(final.headers.get('content-type')).toBe('image/jpeg')
    expect(await final.text()).toBe('')
  })

  it('should reject range requests before fetching the source', async () => {
    const transformer = cloudflareTransformer({
      transport: { mode: 'binding', binding: createImages() },
      dynamic: true,
    })
    const file = await imageFile()
    const getSourceFile = vi.fn()
    const result = await transformer.handleRequest!(
      dynamicArgs({
        file,
        getSourceFile,
        req: request({ query: 'width=100', headers: { range: 'bytes=0-10' } }),
      }),
    )

    expect(result.response!.status).toBe(416)
    expect(getSourceFile).not.toHaveBeenCalled()
  })
})

describe('Cloudflare upload processing', () => {
  it('should convert the main file and continue to subsequent transformers', async () => {
    const transformer = cloudflareTransformer({
      transport: { mode: 'binding', binding: createImages() },
      collections: { media: { resizeOptions: { width: 200 }, formatOptions: { format: 'webp' } } },
    })
    const file = await imageFile()
    const result = await runPipeline({ file, req: request(), transformer })

    expect(result.name).toBe('photo.webp')
    expect(result.type).toBe('image/webp')
    expect(await dimensions(result)).toEqual({ height: 150, width: 200 })
  })

  it('should keep unconfigured uploads unchanged without calling Images', async () => {
    const binding = createImages()
    const transformer = cloudflareTransformer({ transport: { mode: 'binding', binding } })
    const file = await imageFile()
    const result = await transformer.transformFile!(transformFileArgs({ file }))

    expect(result).toEqual({ status: 'continue' })
    expect(binding.input).not.toHaveBeenCalled()
  })

  it.each(['binding', 'remote'] as const)(
    'should generate persisted variants with actual output metadata using %s',
    async (mode) => {
      const binding = createImages()
      const handler = createCloudflareImagesHandler({ binding, token: 'secret' })
      const transformer = cloudflareTransformer({
        transport:
          mode === 'binding'
            ? { mode, binding }
            : {
                mode,
                url: 'https://images.example.com',
                token: 'secret',
                fetch: async (url, init) => handler(new Request(url, init)),
              },
        collections: {
          media: {
            variants: [
              { name: 'thumb', width: 100, height: 100 },
              { name: 'too-large', width: 1000, height: 1000 },
              { name: 'retained', width: 1000, height: 1000, withoutEnlargement: true },
              {
                name: 'custom',
                width: 50,
                formatOptions: { format: 'webp' },
                generateImageName: ({ sizeName, extension }) => `${sizeName}.${extension}`,
              },
            ],
          },
        },
      })
      const file = await imageFile()
      const results = await runTransformUpload({ file, transformer })

      expect(results[0]!.file).toBe(file)
      expect(results.find((r) => r.fieldPath === 'variants.thumb')).toMatchObject({
        height: 100,
        width: 100,
      })
      expect(results.find((r) => r.fieldPath === 'variants.too-large')!.file).toBeUndefined()
      expect(results.find((r) => r.fieldPath === 'variants.retained')).toMatchObject({
        height: 600,
        width: 800,
      })
      expect(results.find((r) => r.fieldPath === 'variants.custom')!.file!.name).toBe('custom.webp')
    },
  )

  it.each([
    {
      cropSize: undefined,
      doc: { _transforms: { crop: { height: 300, width: 400, x: 200, y: 150 } } },
      expectedTrim: { bottom: 150, left: 200, right: 200, top: 150 },
      name: 'the saved crop',
    },
    {
      cropSize: { height: 300, width: 400 },
      doc: {},
      expectedTrim: { bottom: 300, left: 0, right: 400, top: 0 },
      name: 'a request crop size with no saved crop',
    },
  ])(
    'should crop the main file and derive variants from $name',
    async ({ cropSize, doc, expectedTrim }) => {
      const binding = createImages()
      const transformer = cloudflareTransformer({
        transport: { mode: 'binding', binding },
        collections: { media: { crop: true, variants: [{ name: 'thumb', width: 100 }] } },
      })
      const file = await imageFile()
      const results = await runTransformUpload({ cropSize, doc, file, transformer })

      expect(binding.transformOptions[0]!.trim).toEqual(expectedTrim)
      expect(results[0]).toMatchObject({ height: 300, width: 400 })
      expect(results[1]).toMatchObject({ height: 75, width: 100 })
    },
  )

  it('should claim crop and focal point only for its configured collections at upload', () => {
    const transformer = cloudflareTransformer({
      transport: { mode: 'binding', binding: createImages() },
      collections: { media: {} },
    })

    expect(transformer.canTransform!(canTransformArgs({ operation: 'upload' }))).toEqual({
      canTransform: true,
      handledTransformKeys: ['crop', 'focalPoint'],
    })
    expect(
      transformer.canTransform!(canTransformArgs({ collectionSlug: 'other', operation: 'upload' })),
    ).toBe(false)
  })

  it('should publish variant metadata without mutating authored collections', () => {
    const transformer = cloudflareTransformer({
      transport: { mode: 'binding', binding: createImages() },
      collections: { media: { crop: true, variants: [{ name: 'thumb', width: 100 }] } },
    })
    const authored = config({ transformers: [transformer] })
    const result = transformer.init!(authored) as Config

    expect(result.collections![0]!.upload).toMatchObject({
      crop: true,
      variants: [{ name: 'thumb' }],
      variantsTransformerSlug: 'cloudflare',
    })
    expect(authored.collections![0]!.upload).toBe(true)
  })

  it('should reject conflicting ownership and invalid collections at startup', () => {
    const options = {
      transport: { mode: 'binding' as const, binding: createImages() },
      collections: { media: { variants: [{ name: 'thumb', width: 100 }] } },
    }
    const first = cloudflareTransformer(options)
    const second = cloudflareTransformer({ ...options, slug: 'second' })
    const authored = config({ transformers: [first, second] })

    expect(() => first.init!(authored)).toThrow('more than one transformer')
    expect(() =>
      initWith({
        transformer: cloudflareTransformer({ ...options, collections: { other: {} } }),
      }),
    ).toThrow('does not match any configured collection')
    expect(() =>
      initWith({
        transformer: cloudflareTransformer({
          ...options,
          collections: { media: { variants: [{ name: 'filename', width: 100 }] } },
        }),
      }),
    ).toThrow('reserved name')
  })
})

describe('Cloudflare upload configuration contracts', () => {
  it('should report main-file dimensions even when no resize or variants are requested', async () => {
    const transformer = cloudflareTransformer({
      transport: { mode: 'binding', binding: createImages() },
      collections: { media: {} },
    })
    const file = await imageFile()
    const results = await runTransformUpload({ file, transformer })

    expect(results[0]).toMatchObject({ file, height: 600, width: 800 })
  })

  it('should resolve the Images binding lazily with the current Payload request', async () => {
    const resolver = vi.fn(async () => createImages())
    const transformer = cloudflareTransformer({
      transport: { mode: 'binding', binding: resolver },
      dynamic: true,
    })
    const file = await imageFile()
    const req = request({ query: 'width=100' })

    transformer.canTransform!(canTransformArgs({ operation: 'request', req }))
    expect(resolver).not.toHaveBeenCalled()
    const result = await transformer.handleRequest!(dynamicArgs({ file, req }))

    expect(await dimensions(result.response!)).toEqual({ height: 75, width: 100 })
    expect(resolver).toHaveBeenCalledWith({ req })
  })

  it.each([
    {
      doc: { _transforms: { focalPoint: { x: 75, y: 25 } } },
      expected: { mode: 'box-center', x: 0.75, y: 0.25 },
      focalPoint: true,
      name: 'a saved focal point',
    },
    {
      doc: { focalX: 75, focalY: 25 },
      expected: { mode: 'box-center', x: 0.75, y: 0.25 },
      focalPoint: true,
      name: 'a legacy focalX and focalY',
    },
    {
      doc: { _transforms: { focalPoint: { x: 75, y: 25 } } },
      expected: undefined,
      focalPoint: false,
      name: 'a saved focal point when focalPoint is disabled',
    },
  ])('should set variant gravity from $name', async ({ doc, expected, focalPoint }) => {
    const binding = createImages()
    const transformer = cloudflareTransformer({
      transport: { mode: 'binding', binding },
      collections: {
        media: { focalPoint, variants: [{ name: 'thumb', width: 100, height: 100 }] },
      },
    })

    await runTransformUpload({ doc, file: await imageFile(), transformer })

    expect(binding.transformOptions[0]!.gravity).toEqual(expected)
  })

  it('should preserve explicit gravity over a saved focal point', async () => {
    const binding = createImages()
    const transformer = cloudflareTransformer({
      transport: { mode: 'binding', binding },
      collections: {
        media: { variants: [{ name: 'thumb', width: 100, height: 100, gravity: 'auto' }] },
      },
    })

    await runTransformUpload({
      doc: { _transforms: { focalPoint: { x: 75, y: 25 } } },
      file: await imageFile(),
      transformer,
    })

    expect(binding.transformOptions[0]!.gravity).toBe('auto')
  })
})
