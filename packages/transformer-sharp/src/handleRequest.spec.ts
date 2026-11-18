import type { PayloadRequest } from 'payload'

import { readFileSync } from 'fs'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { describe, expect, it, vi } from 'vitest'

import { createHandleRequest } from './handleRequest.js'
import { resolveSharpDynamicDefaults } from './sharpTransformer.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
// 200x200, 44 frames.
const animatedWebp = readFileSync(path.resolve(dirname, '../../../test/uploads/animated.webp'))

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
  dynamicDefaults = resolveSharpDynamicDefaults(),
  mimeType = 'image/png',
  query,
  sourceBuffer,
}: {
  dynamicDefaults?: ReturnType<typeof resolveSharpDynamicDefaults>
  mimeType?: string
  query: string
  sourceBuffer: Buffer
}) => {
  const handleRequest = createHandleRequest({ dynamicDefaults, sharpDependency: sharp })
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
})
