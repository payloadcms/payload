import type { PayloadRequest } from 'payload'

import sharp from 'sharp'
import { describe, expect, it, vi } from 'vitest'

import { createHandleRequest } from './handleRequest.js'
import { resolveSharpDynamicDefaults } from './sharpTransformer.js'

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
  it('should reject a width-only request whose aspect-ratio-derived output exceeds maxPixels', async () => {
    const sourceBuffer = await makeSourceImage({ height: 100, width: 10 })

    // 10x100 source at width=100 renders 100x1000 = 100,000 pixels, 10x the limit.
    const result = await resizeReal({
      dynamicDefaults: resolveSharpDynamicDefaults({ maxPixels: 10_000 }),
      query: 'width=100',
      sourceBuffer,
    })

    expect(result.response?.status).toBe(400)
  })

  it('should not upscale when withoutEnlargement is configured as the default', async () => {
    const sourceBuffer = await makeSourceImage({ height: 100, width: 100 })

    const metadata = await getOutputMetadata(
      await resizeReal({
        dynamicDefaults: resolveSharpDynamicDefaults({ withoutEnlargement: true }),
        query: 'width=300',
        sourceBuffer,
      }),
    )

    expect(metadata.width).toBe(100)
    expect(metadata.height).toBe(100)
  })

  it('should allow a per-request withoutEnlargement=false to override a configured withoutEnlargement=true default', async () => {
    const sourceBuffer = await makeSourceImage({ height: 100, width: 100 })

    const metadata = await getOutputMetadata(
      await resizeReal({
        dynamicDefaults: resolveSharpDynamicDefaults({ withoutEnlargement: true }),
        query: 'width=300&withoutEnlargement=false',
        sourceBuffer,
      }),
    )

    expect(metadata.width).toBe(300)
  })

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
