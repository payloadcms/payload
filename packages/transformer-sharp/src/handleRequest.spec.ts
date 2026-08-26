import type { PayloadRequest } from 'payload'

import sharp from 'sharp'
import { describe, expect, it, vi } from 'vitest'

import { createHandleRequest } from './handleRequest.js'
import { resolveSharpDynamicDefaults } from './sharpTransformer.js'

const makeFakePipeline = (outputBuffer: Buffer) => ({
  resize: vi.fn().mockReturnThis(),
  toBuffer: vi.fn().mockResolvedValue(outputBuffer),
})

const makeFakeSharp = (outputBuffer: Buffer = Buffer.from('resized-bytes')) => {
  const pipeline = makeFakePipeline(outputBuffer)
  const sharpFn = vi.fn().mockReturnValue(pipeline)
  return { pipeline, sharpFn }
}

const makeReq = ({
  method = 'GET',
  query = '',
  rangeHeader = null as null | string,
} = {}): PayloadRequest =>
  ({
    headers: new Headers(rangeHeader ? { range: rangeHeader } : {}),
    method,
    payload: { logger: { error: vi.fn() } },
    searchParams: new URLSearchParams(query),
  }) as unknown as PayloadRequest

const baseArgs = (overrides: Record<string, unknown> = {}) => ({
  collectionSlug: 'media',
  documentID: '1',
  filename: 'logo.png',
  mimeType: 'image/png',
  ...overrides,
})

describe('createHandleRequest', () => {
  it('should return 400 without calling getSourceFile or Sharp for an invalid dynamic request', async () => {
    const { sharpFn } = makeFakeSharp()
    const handleRequest = createHandleRequest({
      dynamicDefaults: resolveSharpDynamicDefaults(),
      sharpDependency: sharpFn as never,
    })
    const getSourceFile = vi.fn()

    const result = await handleRequest({
      ...baseArgs(),
      getSourceFile,
      req: makeReq({ query: 'width=not-a-number' }),
    })

    expect(result.status).toBe('complete')
    expect(result.response?.status).toBe(400)
    expect(getSourceFile).not.toHaveBeenCalled()
    expect(sharpFn).not.toHaveBeenCalled()
  })

  it('should return 416 for a Range header on a recognized dynamic request, without calling getSourceFile or Sharp', async () => {
    const { sharpFn } = makeFakeSharp()
    const handleRequest = createHandleRequest({
      dynamicDefaults: resolveSharpDynamicDefaults(),
      sharpDependency: sharpFn as never,
    })
    const getSourceFile = vi.fn()

    const result = await handleRequest({
      ...baseArgs(),
      getSourceFile,
      req: makeReq({ query: 'width=500', rangeHeader: 'bytes=0-99' }),
    })

    expect(result.status).toBe('complete')
    expect(result.response?.status).toBe(416)
    expect(getSourceFile).not.toHaveBeenCalled()
    expect(sharpFn).not.toHaveBeenCalled()
  })

  it('should return complete with the source response unchanged when source retrieval was not ok', async () => {
    const { sharpFn } = makeFakeSharp()
    const handleRequest = createHandleRequest({
      dynamicDefaults: resolveSharpDynamicDefaults(),
      sharpDependency: sharpFn as never,
    })
    const sourceResponse = new Response(null, { status: 404, statusText: 'Not Found' })
    const getSourceFile = vi.fn().mockResolvedValue(sourceResponse)

    const result = await handleRequest({
      ...baseArgs(),
      getSourceFile,
      req: makeReq({ query: 'width=500' }),
    })

    expect(result).toEqual({ response: sourceResponse, status: 'complete' })
    expect(sharpFn).not.toHaveBeenCalled()
  })

  it('should return continue with a resized response on success, recalculating headers', async () => {
    const outputBuffer = Buffer.from('resized-bytes')
    const { pipeline, sharpFn } = makeFakeSharp(outputBuffer)
    const handleRequest = createHandleRequest({
      dynamicDefaults: resolveSharpDynamicDefaults(),
      sharpDependency: sharpFn as never,
    })
    const sourceResponse = new Response(Buffer.from('source-bytes'), {
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Range': 'bytes 0-1/2',
        ETag: 'source-etag',
        'Last-Modified': 'yesterday',
      },
      status: 200,
    })
    const getSourceFile = vi.fn().mockResolvedValue(sourceResponse)

    const result = await handleRequest({
      ...baseArgs(),
      getSourceFile,
      req: makeReq({ query: 'width=500' }),
    })

    expect(result.status).toBe('continue')
    expect(result.response?.status).toBe(200)
    expect(new Uint8Array(await result.response!.arrayBuffer())).toEqual(
      new Uint8Array(outputBuffer),
    )
    expect(result.response?.headers.get('Content-Type')).toBe('image/png')
    expect(result.response?.headers.get('Content-Length')).toBe(String(outputBuffer.length))
    expect(result.response?.headers.get('ETag')).toBeNull()
    expect(result.response?.headers.get('Last-Modified')).toBeNull()
    expect(result.response?.headers.get('Accept-Ranges')).toBeNull()
    expect(result.response?.headers.get('Content-Range')).toBeNull()
    expect(result.response?.headers.get('Cache-Control')).toBeNull()
    expect(getSourceFile).toHaveBeenCalledTimes(1)
    expect(pipeline.toBuffer).toHaveBeenCalledTimes(1)
  })

  it('should return no body for a HEAD request while still running the resize pipeline', async () => {
    const outputBuffer = Buffer.from('resized-bytes')
    const { pipeline, sharpFn } = makeFakeSharp(outputBuffer)
    const handleRequest = createHandleRequest({
      dynamicDefaults: resolveSharpDynamicDefaults(),
      sharpDependency: sharpFn as never,
    })
    const getSourceFile = vi.fn().mockResolvedValue(new Response(Buffer.from('source-bytes')))

    const result = await handleRequest({
      ...baseArgs(),
      getSourceFile,
      req: makeReq({ method: 'HEAD', query: 'width=500' }),
    })

    expect(result.response?.status).toBe(200)
    expect(await result.response!.text()).toBe('')
    expect(pipeline.toBuffer).toHaveBeenCalledTimes(1)
  })

  it('should let an unexpected Sharp error propagate uncaught', async () => {
    const pipeline = {
      resize: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockRejectedValue(new Error('sharp exploded')),
    }
    const sharpFn = vi.fn().mockReturnValue(pipeline)
    const handleRequest = createHandleRequest({
      dynamicDefaults: resolveSharpDynamicDefaults(),
      sharpDependency: sharpFn as never,
    })
    const getSourceFile = vi.fn().mockResolvedValue(new Response(Buffer.from('source-bytes')))

    await expect(
      handleRequest({ ...baseArgs(), getSourceFile, req: makeReq({ query: 'width=500' }) }),
    ).rejects.toThrow('sharp exploded')
  })

  it('should pass the configured fit/position/withoutEnlargement defaults to resize()', async () => {
    const { pipeline, sharpFn } = makeFakeSharp()
    const handleRequest = createHandleRequest({
      dynamicDefaults: resolveSharpDynamicDefaults(),
      sharpDependency: sharpFn as never,
    })
    const getSourceFile = vi.fn().mockResolvedValue(new Response(Buffer.from('source-bytes')))

    await handleRequest({ ...baseArgs(), getSourceFile, req: makeReq({ query: 'width=500' }) })

    expect(pipeline.resize).toHaveBeenCalledWith({
      fit: 'cover',
      height: undefined,
      position: 'center',
      width: 500,
      withoutEnlargement: false,
    })
  })

  it('should override the configured withoutEnlargement default per request', async () => {
    const { pipeline, sharpFn } = makeFakeSharp()
    const handleRequest = createHandleRequest({
      dynamicDefaults: resolveSharpDynamicDefaults({ withoutEnlargement: false }),
      sharpDependency: sharpFn as never,
    })
    const getSourceFile = vi.fn().mockResolvedValue(new Response(Buffer.from('source-bytes')))

    await handleRequest({
      ...baseArgs(),
      getSourceFile,
      req: makeReq({ query: 'width=500&withoutEnlargement=true' }),
    })

    expect(pipeline.resize).toHaveBeenCalledWith(
      expect.objectContaining({ withoutEnlargement: true }),
    )
  })

  it('should pass animated:true to Sharp for animated-capable MIME types', async () => {
    const { sharpFn } = makeFakeSharp()
    const handleRequest = createHandleRequest({
      dynamicDefaults: resolveSharpDynamicDefaults(),
      sharpDependency: sharpFn as never,
    })
    const sourceBuffer = Buffer.from('source-bytes')
    const getSourceFile = vi.fn().mockResolvedValue(new Response(sourceBuffer))

    await handleRequest({
      ...baseArgs({ mimeType: 'image/webp' }),
      getSourceFile,
      req: makeReq({ query: 'width=500' }),
    })

    expect(sharpFn).toHaveBeenCalledWith(expect.anything(), { animated: true })
  })

  it('should not pass animated:true to Sharp for non-animated-capable MIME types', async () => {
    const { sharpFn } = makeFakeSharp()
    const handleRequest = createHandleRequest({
      dynamicDefaults: resolveSharpDynamicDefaults(),
      sharpDependency: sharpFn as never,
    })
    const getSourceFile = vi.fn().mockResolvedValue(new Response(Buffer.from('source-bytes')))

    await handleRequest({
      ...baseArgs({ mimeType: 'image/png' }),
      getSourceFile,
      req: makeReq({ query: 'width=500' }),
    })

    expect(sharpFn).toHaveBeenCalledWith(expect.anything(), {})
  })
})

describe('createHandleRequest (real Sharp pipeline)', () => {
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
      ...baseArgs({ mimeType }),
      getSourceFile,
      req: makeReq({ query }),
    })

    const outputBuffer = Buffer.from(await result.response!.arrayBuffer())
    const metadata = await sharp(outputBuffer).metadata()

    return { metadata, outputBuffer, result }
  }

  it('should preserve aspect ratio when only width is provided', async () => {
    const sourceBuffer = await makeSourceImage({ height: 200, width: 400 })

    const { metadata } = await resizeReal({ query: 'width=200', sourceBuffer })

    expect(metadata.width).toBe(200)
    expect(metadata.height).toBe(100)
  })

  it('should preserve aspect ratio when only height is provided', async () => {
    const sourceBuffer = await makeSourceImage({ height: 200, width: 400 })

    const { metadata } = await resizeReal({ query: 'height=50', sourceBuffer })

    expect(metadata.height).toBe(50)
    expect(metadata.width).toBe(100)
  })

  it('should produce exact, centered cover output when width and height are both provided', async () => {
    const sourceBuffer = await makeSourceImage({ height: 200, width: 400 })

    const { metadata } = await resizeReal({ query: 'width=100&height=100', sourceBuffer })

    expect(metadata.width).toBe(100)
    expect(metadata.height).toBe(100)
  })

  it('should upscale by default when the requested dimensions exceed the source', async () => {
    const sourceBuffer = await makeSourceImage({ height: 100, width: 100 })

    const { metadata } = await resizeReal({ query: 'width=300', sourceBuffer })

    expect(metadata.width).toBe(300)
    expect(metadata.height).toBe(300)
  })

  it('should not upscale when withoutEnlargement is configured as the default', async () => {
    const sourceBuffer = await makeSourceImage({ height: 100, width: 100 })

    const { metadata } = await resizeReal({
      dynamicDefaults: resolveSharpDynamicDefaults({ withoutEnlargement: true }),
      query: 'width=300',
      sourceBuffer,
    })

    expect(metadata.width).toBe(100)
    expect(metadata.height).toBe(100)
  })

  it('should allow a per-request withoutEnlargement=false to override a configured withoutEnlargement=true default', async () => {
    const sourceBuffer = await makeSourceImage({ height: 100, width: 100 })

    const { metadata } = await resizeReal({
      dynamicDefaults: resolveSharpDynamicDefaults({ withoutEnlargement: true }),
      query: 'width=300&withoutEnlargement=false',
      sourceBuffer,
    })

    expect(metadata.width).toBe(300)
  })

  it('should allow a per-request withoutEnlargement=true to override a configured withoutEnlargement=false default', async () => {
    const sourceBuffer = await makeSourceImage({ height: 100, width: 100 })

    const { metadata } = await resizeReal({
      dynamicDefaults: resolveSharpDynamicDefaults({ withoutEnlargement: false }),
      query: 'width=300&withoutEnlargement=true',
      sourceBuffer,
    })

    expect(metadata.width).toBe(100)
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

      const { metadata } = await resizeReal({
        mimeType: `image/${format}`,
        query: 'width=100',
        sourceBuffer,
      })

      expect(metadata.format).toBe(expectedMetadataFormat)
    },
  )
})
