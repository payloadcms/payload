import type { PayloadRequest } from 'payload'

import { readFileSync } from 'fs'
import { crc32, createDeflate } from 'node:zlib'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { describe, expect, it, vi } from 'vitest'

import type { SharpCollectionConfig } from './types.js'

import { createHandleRequest } from './handleRequest.js'
import { resolveSharpDynamicDefaults } from './sharpTransformer.js'
import { DEFAULT_MAX_INPUT_PIXELS } from './types.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
// 200x200, 44 frames.
const animatedWebp = readFileSync(path.resolve(dirname, '../../../test/uploads/animated.webp'))

/**
 * Builds a valid 1-bit grayscale PNG of the requested size without holding the
 * raw image in memory: reaching Sharp's 268,402,689-pixel default limit needs
 * a huge image, and a flat-colour PNG compresses to kilobytes. Each scanline
 * is a filter byte plus zero bytes, streamed through zlib.
 */
const makeOversizedPng = async ({
  height,
  width,
}: {
  height: number
  width: number
}): Promise<Buffer> => {
  const pngChunk = (type: string, data: Buffer): Buffer => {
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length)
    const typeAndData = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(typeAndData))
    return Buffer.concat([length, typeAndData, crc])
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 1 // 1-bit depth
  ihdr[9] = 0 // grayscale

  const row = Buffer.alloc(1 + Math.ceil(width / 8))
  // Feed the deflater in ~1 MB chunks instead of one tiny write per row.
  const rowsPerChunk = Math.max(1, Math.floor((1024 * 1024) / row.length))
  const chunkBuffer = Buffer.alloc(row.length * rowsPerChunk)
  const deflate = createDeflate({ level: 1 })
  const parts: Buffer[] = []
  deflate.on('data', (chunk) => parts.push(chunk as Buffer))
  const finished = new Promise<void>((resolve, reject) => {
    deflate.on('end', resolve)
    deflate.on('error', reject)
  })
  for (let y = 0; y < height; y += rowsPerChunk) {
    const rows = Math.min(rowsPerChunk, height - y)
    const slice = rows === rowsPerChunk ? chunkBuffer : chunkBuffer.subarray(0, rows * row.length)
    if (!deflate.write(slice)) {
      await new Promise<void>((resolve) => deflate.once('drain', resolve))
    }
  }
  deflate.end()
  await finished

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', Buffer.concat(parts)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

const oversizedPngs = new Map<string, Promise<Buffer>>()
const getOversizedPng = ({ height, width }: { height: number; width: number }): Promise<Buffer> => {
  const key = `${width}x${height}`
  const cached = oversizedPngs.get(key)
  if (cached) {
    return cached
  }
  const generated = makeOversizedPng({ height, width })
  oversizedPngs.set(key, generated)
  return generated
}

const makeReq = ({ query = '' }: { query?: string } = {}): PayloadRequest =>
  ({
    headers: new Headers(),
    method: 'GET',
    payload: { logger: { error: vi.fn() } },
    searchParams: new URLSearchParams(query),
  }) as unknown as PayloadRequest

const makeSourceImage = async ({
  background = { b: 0, g: 128, r: 255 },
  format = 'png' as Parameters<ReturnType<typeof sharp>['toFormat']>[0],
  height = 200,
  width = 400,
} = {}): Promise<Buffer> =>
  sharp({ create: { background, channels: 3, height, width } })
    .toFormat(format)
    .toBuffer()

const resizeReal = async ({
  collections = {},
  dynamicDefaults = resolveSharpDynamicDefaults(),
  maxInputPixels = DEFAULT_MAX_INPUT_PIXELS,
  mimeType = 'image/png',
  query,
  sourceBuffer,
}: {
  collections?: Partial<Record<string, SharpCollectionConfig>>
  dynamicDefaults?: ReturnType<typeof resolveSharpDynamicDefaults>
  maxInputPixels?: number
  mimeType?: string
  query: string
  sourceBuffer: Buffer
}) => {
  const handleRequest = createHandleRequest({
    collections,
    dynamicDefaults,
    maxInputPixels,
    sharpDependency: sharp,
  })
  const getSourceFile = vi.fn().mockResolvedValue(new Response(sourceBuffer))

  const result = await handleRequest({
    collectionSlug: 'media',
    documentID: '1',
    filename: 'logo.png',
    getSourceFile,
    mimeType,
    req: makeReq({ query }),
  })

  return result
}

const getOutputMetadata = async (result: Awaited<ReturnType<typeof resizeReal>>) =>
  sharp(Buffer.from(await result.response!.arrayBuffer())).metadata()

describe('createHandleRequest', () => {
  it.each([
    // 10x100 source.
    { orientation: undefined, sourceHeight: 100, sourceWidth: 10 },
    // Stored 100x10 but tagged orientation 6, so it displays as 10x100.
    { orientation: 6, sourceHeight: 10, sourceWidth: 100 },
  ])(
    'should reject a width-only request whose displayed aspect ratio exceeds maxPixels (orientation $orientation)',
    async ({ orientation, sourceHeight, sourceWidth }) => {
      const source = sharp(
        await makeSourceImage({ format: 'jpeg', height: sourceHeight, width: sourceWidth }),
      )
      const sourceBuffer = await (
        orientation ? source.withMetadata({ orientation }) : source
      ).toBuffer()

      // Displayed 10x100 at width=100 renders 100x1000 = 100,000 pixels, 10x the limit.
      const result = await resizeReal({
        dynamicDefaults: resolveSharpDynamicDefaults({ maxPixels: 10_000 }),
        mimeType: 'image/jpeg',
        query: 'width=100',
        sourceBuffer,
      })

      expect(result.response?.status).toBe(400)
    },
  )

  it.each(['width=1000&height=1000', 'width=1000'])(
    'should count every frame of an animated source against maxPixels (%s)',
    async (query) => {
      // 1000x1000 per frame is within the 16,777,216 default, but across 44 frames
      // Sharp would render 44,000,000 pixels.
      const result = await resizeReal({
        mimeType: 'image/webp',
        query,
        sourceBuffer: animatedWebp,
      })

      expect(result.response?.status).toBe(400)
    },
  )

  it('should resize every frame of an animated source within maxPixels', async () => {
    const metadata = await sharp(
      Buffer.from(
        await (
          await resizeReal({
            mimeType: 'image/webp',
            query: 'width=100',
            sourceBuffer: animatedWebp,
          })
        ).response!.arrayBuffer(),
      ),
      { animated: true },
    ).metadata()

    expect(metadata.width).toBe(100)
    expect(metadata.pages).toBe(44)
  })

  it('should apply the EXIF orientation of the source before resizing', async () => {
    // Stored 400x200 but tagged orientation 6, so it displays as 200x400.
    const sourceBuffer = await sharp(await makeSourceImage({ format: 'jpeg' }))
      .withMetadata({ orientation: 6 })
      .toBuffer()

    const metadata = await getOutputMetadata(
      await resizeReal({ mimeType: 'image/jpeg', query: 'width=100', sourceBuffer }),
    )

    expect(metadata.width).toBe(100)
    expect(metadata.height).toBe(200)
  })

  it.each([
    { expectedWidth: 100, query: 'width=300' },
    { expectedWidth: 300, query: 'width=300&withoutEnlargement=false' },
  ])(
    'should apply a configured withoutEnlargement=true default unless the request overrides it ($query)',
    async ({ expectedWidth, query }) => {
      const sourceBuffer = await makeSourceImage({ height: 100, width: 100 })

      const metadata = await getOutputMetadata(
        await resizeReal({
          dynamicDefaults: resolveSharpDynamicDefaults({ withoutEnlargement: true }),
          query,
          sourceBuffer,
        }),
      )

      expect(metadata.width).toBe(expectedWidth)
    },
  )

  it.each([
    ['jpeg', 'jpeg'],
    ['png', 'png'],
    ['webp', 'webp'],
    ['tiff', 'tiff'],
    ['gif', 'gif'],
    // AVIF is stored in a HEIF container — Sharp reports its metadata format as
    // "heif", not "avif", even though the MIME type and file extension are AVIF.
    ['avif', 'heif'],
  ] as const)(
    'should retain the source format (%s) in the resized output',
    async (format, expectedMetadataFormat) => {
      const sourceBuffer = await makeSourceImage({ format })

      const metadata = await getOutputMetadata(
        await resizeReal({ mimeType: `image/${format}`, query: 'width=100', sourceBuffer }),
      )

      expect(metadata.format).toBe(expectedMetadataFormat)
    },
  )

  it('should refuse a dynamic resize whose source exceeds maxInputPixels with a 400', async () => {
    // 400x400 is 160,000 pixels — over a 10,000 cap. The output (100x100) is
    // well within maxPixels, so only the source cap can refuse this.
    const sourceBuffer = await makeSourceImage({ height: 400, width: 400 })

    const result = await resizeReal({
      maxInputPixels: 10_000,
      mimeType: 'image/png',
      query: 'width=100',
      sourceBuffer,
    })

    expect(result.response?.status).toBe(400)
  })

  it('should refuse a 20000x20000 source (400M pixels) with a 400 instead of failing the metadata probe', async () => {
    // Sharp enforces its own 268,402,689-pixel default even on `metadata()`,
    // so without an explicitly uncapped probe the handler would throw here
    // instead of returning the required 400.
    const sourceBuffer = await getOversizedPng({ height: 20000, width: 20000 })

    const result = await resizeReal({
      maxInputPixels: 50_000_000,
      mimeType: 'image/png',
      query: 'width=100',
      sourceBuffer,
    })

    expect(result.response?.status).toBe(400)
    // Generating the 20000x20000 fixture streams ~50 MB through zlib.
  }, 30_000)

  it("should refuse a dynamic resize whose source exceeds the collection's own maxInputPixels", async () => {
    // 2000x2000 is 4,000,000 pixels — within the 50M global cap but over the
    // media collection's 1,000,000 cap.
    const sourceBuffer = await makeSourceImage({ height: 2000, width: 2000 })

    const result = await resizeReal({
      collections: { media: { maxInputPixels: 1_000_000 } },
      maxInputPixels: DEFAULT_MAX_INPUT_PIXELS,
      mimeType: 'image/png',
      query: 'width=100',
      sourceBuffer,
    })

    expect(result.response?.status).toBe(400)
  })

  it('should honour a collection cap higher than the global cap', async () => {
    // 12000x12000 is 144,000,000 pixels — over the 50M global cap but within
    // the media collection's 200,000,000 cap.
    const sourceBuffer = await getOversizedPng({ height: 12000, width: 12000 })

    const metadata = await getOutputMetadata(
      await resizeReal({
        collections: { media: { maxInputPixels: 200_000_000 } },
        maxInputPixels: DEFAULT_MAX_INPUT_PIXELS,
        mimeType: 'image/png',
        query: 'width=100',
        sourceBuffer,
      }),
    )

    expect(metadata.width).toBe(100)
    expect(metadata.height).toBe(100)
    // Decodes a 144M-pixel source, and generating its fixture streams ~18 MB through zlib.
  }, 60_000)

  it('should count every frame of an animated source against maxInputPixels', async () => {
    // 200x200 across 44 frames is 1,760,000 pixels — over a 1,000,000 cap,
    // even though the requested 100x100 output is within maxPixels.
    const result = await resizeReal({
      maxInputPixels: 1_000_000,
      mimeType: 'image/webp',
      query: 'width=100',
      sourceBuffer: animatedWebp,
    })

    expect(result.response?.status).toBe(400)
  })

  it('should resize a source within maxInputPixels', async () => {
    const sourceBuffer = await makeSourceImage({ height: 400, width: 400 })

    const metadata = await getOutputMetadata(
      await resizeReal({
        maxInputPixels: 50_000_000,
        mimeType: 'image/png',
        query: 'width=100',
        sourceBuffer,
      }),
    )

    expect(metadata.width).toBe(100)
    expect(metadata.height).toBe(100)
  })
})
