import type { PayloadRequest } from '../../../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import { getRangeRequestInfo } from '../../getRangeRequestInfo.js'
import { createClientUploadFileSource } from './createClientUploadFileSource.js'

const bytes = Buffer.from(Array.from({ length: 100 }, (_, index) => index))

type Handler = (req: PayloadRequest, args: { params: Record<string, unknown> }) => Promise<Response>

/** Serves `bytes` with HTTP Range, as the storage adapters do on a client-upload read. */
const rangeHandler: Handler = async (req) => {
  const info = getRangeRequestInfo({
    fileSize: bytes.length,
    rangeHeader: req.headers.get('range'),
  })

  if (info.type === 'invalid') {
    return new Response(null, { headers: info.headers, status: info.status })
  }

  const body = info.type === 'partial' ? bytes.subarray(info.rangeStart, info.rangeEnd + 1) : bytes

  return new Response(body, { headers: info.headers, status: info.status })
}

const createSource = ({
  context = {},
  handler = rangeHandler,
}: { context?: Record<string, unknown>; handler?: Handler } = {}) => {
  const handlerSpy = vi.fn(handler)
  const req = {
    context,
    headers: new Headers(),
    payload: {
      collections: { media: { config: { upload: { handlers: [handlerSpy] } } } },
      logger: { error: vi.fn() },
    },
  } as unknown as PayloadRequest
  const fileSource = createClientUploadFileSource({
    collectionSlug: 'media',
    file: {
      name: 'clip.mp4',
      data: Buffer.alloc(0),
      mimetype: 'video/mp4',
      size: bytes.length,
      uploadReference: { prefix: '' },
    },
    req,
  })

  return { fileSource, handlerSpy }
}

const readStream = async (stream: ReadableStream<Uint8Array>) =>
  Buffer.from(await new Response(stream).arrayBuffer())

describe('createClientUploadFileSource', () => {
  it('should describe the upload without reading it', () => {
    const { fileSource, handlerSpy } = createSource()

    expect(fileSource).toMatchObject({
      filename: 'clip.mp4',
      mimeType: 'video/mp4',
      sizeInBytes: 100,
    })
    expect(handlerSpy).not.toHaveBeenCalled()
  })

  it('should request only the asked range from the upload handler', async () => {
    const { fileSource, handlerSpy } = createSource()

    const read = await fileSource.readFileBytes({ numberOfBytes: 10, startByte: 90 })

    expect(Buffer.from(read)).toEqual(bytes.subarray(90, 100))
    expect(handlerSpy).toHaveBeenCalledOnce()
    expect(handlerSpy.mock.calls[0]![0].headers.get('range')).toBe('bytes=90-99')
  })

  it('should stop a range at the end of the file', async () => {
    const { fileSource, handlerSpy } = createSource()

    const read = await fileSource.readFileBytes({ numberOfBytes: 10, startByte: 95 })

    expect(Buffer.from(read)).toEqual(bytes.subarray(95))
    expect(handlerSpy.mock.calls[0]![0].headers.get('range')).toBe('bytes=95-99')
  })

  it('should stream a range', async () => {
    const { fileSource, handlerSpy } = createSource()

    const stream = await fileSource.streamFile({ numberOfBytes: 5, startByte: 10 })

    expect(await readStream(stream)).toEqual(bytes.subarray(10, 15))
    expect(handlerSpy.mock.calls[0]![0].headers.get('range')).toBe('bytes=10-14')
  })

  it('should stream the whole file when called with no range', async () => {
    const { fileSource } = createSource()

    const stream = await fileSource.streamFile()

    expect(await readStream(stream)).toEqual(bytes)
  })

  it('should make no request for an empty range at the end of the file', async () => {
    const { fileSource, handlerSpy } = createSource()

    const read = await fileSource.readFileBytes({ numberOfBytes: 10, startByte: 100 })

    expect(read.length).toBe(0)
    expect(handlerSpy).not.toHaveBeenCalled()
  })

  it('should reject a range that starts past the end of the file', async () => {
    const { fileSource } = createSource()

    await expect(fileSource.readFileBytes({ numberOfBytes: 1, startByte: 101 })).rejects.toThrow(
      'past the end of the file',
    )
  })

  it('should read the asked bytes from a handler that ignores the range', async () => {
    const { fileSource } = createSource({
      handler: async () => new Response(bytes, { status: 200 }),
    })

    const read = await fileSource.readFileBytes({ numberOfBytes: 10, startByte: 90 })

    expect(Buffer.from(read)).toEqual(bytes.subarray(90, 100))
  })

  it('should stream the asked bytes from a handler that ignores the range', async () => {
    const { fileSource } = createSource({
      handler: async () => new Response(bytes, { status: 200 }),
    })

    const stream = await fileSource.streamFile({ numberOfBytes: 5, startByte: 10 })

    expect(await readStream(stream)).toEqual(bytes.subarray(10, 15))
  })

  it('should read the asked bytes from a partial response with the whole file', async () => {
    // R2 under Miniflare answers 206 with the range's headers and the whole file.
    const { fileSource } = createSource({
      handler: async () =>
        new Response(bytes, { headers: { 'Content-Range': 'bytes 90-99/100' }, status: 206 }),
    })

    const read = await fileSource.readFileBytes({ numberOfBytes: 10, startByte: 90 })

    expect(Buffer.from(read)).toEqual(bytes.subarray(90, 100))
  })

  it('should stream the asked bytes from a partial response with the whole file', async () => {
    const { fileSource } = createSource({
      handler: async () =>
        new Response(bytes, { headers: { 'Content-Range': 'bytes 0-4/100' }, status: 206 }),
    })

    const stream = await fileSource.streamFile({ numberOfBytes: 5, startByte: 0 })

    expect(await readStream(stream)).toEqual(bytes.subarray(0, 5))
  })

  it('should fail a stream from a later byte when the partial response has the whole file', async () => {
    // Its first bytes are the file's first bytes, not the range's, and they cannot be taken back.
    const { fileSource } = createSource({
      handler: async () =>
        new Response(bytes, { headers: { 'Content-Range': 'bytes 10-14/100' }, status: 206 }),
    })

    const stream = await fileSource.streamFile({ numberOfBytes: 5, startByte: 10 })

    await expect(readStream(stream)).rejects.toMatchObject({
      message: 'Uploaded source is not readable.',
      status: 400,
    })
  })

  it('should reject a partial response for another range', async () => {
    const { fileSource } = createSource({
      handler: async () =>
        new Response(bytes.subarray(80, 90), {
          headers: { 'Content-Range': 'bytes 80-89/100' },
          status: 206,
        }),
    })

    await expect(
      fileSource.readFileBytes({ numberOfBytes: 10, startByte: 90 }),
    ).rejects.toMatchObject({
      message: 'Uploaded source is not readable.',
      status: 400,
    })
  })

  it('should reject a partial response for a file of another size', async () => {
    const { fileSource } = createSource({
      handler: async () =>
        new Response(bytes.subarray(90), {
          headers: { 'Content-Range': 'bytes 90-99/200' },
          status: 206,
        }),
    })

    await expect(
      fileSource.readFileBytes({ numberOfBytes: 10, startByte: 90 }),
    ).rejects.toMatchObject({
      message: 'Uploaded source is not readable.',
      status: 400,
    })
  })

  it('should reject a partial response with fewer bytes than the range', async () => {
    const { fileSource } = createSource({
      handler: async () =>
        new Response(bytes.subarray(90, 95), {
          headers: { 'Content-Range': 'bytes 90-99/100' },
          status: 206,
        }),
    })

    await expect(
      fileSource.readFileBytes({ numberOfBytes: 10, startByte: 90 }),
    ).rejects.toMatchObject({
      message: 'Uploaded source is not readable.',
      status: 400,
    })
  })

  it('should fail a stream whose partial response has fewer bytes than the range', async () => {
    const { fileSource } = createSource({
      handler: async () =>
        new Response(bytes.subarray(10, 12), {
          headers: { 'Content-Range': 'bytes 10-14/100' },
          status: 206,
        }),
    })

    const stream = await fileSource.streamFile({ numberOfBytes: 5, startByte: 10 })

    await expect(readStream(stream)).rejects.toMatchObject({
      message: 'Uploaded source is not readable.',
      status: 400,
    })
  })

  it('should reject a response with no body', async () => {
    // Vercel Blob answers 204 when its own fetch fails.
    const { fileSource } = createSource({
      handler: async () => new Response(null, { status: 204 }),
    })

    await expect(
      fileSource.readFileBytes({ numberOfBytes: 10, startByte: 0 }),
    ).rejects.toMatchObject({
      message: 'Uploaded source is not readable.',
      status: 400,
    })
  })

  it('should reject a response that the handler could not serve', async () => {
    const { fileSource } = createSource({
      handler: async () => new Response(null, { status: 416 }),
    })

    await expect(
      fileSource.readFileBytes({ numberOfBytes: 10, startByte: 0 }),
    ).rejects.toMatchObject({
      message: 'Uploaded source is not readable.',
      status: 400,
    })
  })

  it('should not call the handler when the signal is already aborted', async () => {
    const { fileSource, handlerSpy } = createSource()

    await expect(
      fileSource.readFileBytes({ numberOfBytes: 1, signal: AbortSignal.abort(), startByte: 0 }),
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(handlerSpy).not.toHaveBeenCalled()
  })

  it('should give the handler a request signal that aborts with the read', async () => {
    const controller = new AbortController()
    const { fileSource, handlerSpy } = createSource()

    await fileSource.readFileBytes({ numberOfBytes: 1, signal: controller.signal, startByte: 0 })
    controller.abort()

    expect(handlerSpy.mock.calls[0]![0].signal.aborted).toBe(true)
  })

  it('should fail a stream when its signal aborts', async () => {
    const controller = new AbortController()
    const { fileSource } = createSource()

    const stream = await fileSource.streamFile({ signal: controller.signal })
    controller.abort()

    await expect(readStream(stream)).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('should read the object by the filename in the verified receipt', async () => {
    const { fileSource, handlerSpy } = createSource({
      context: { _payloadVerifiedProviderOriginal: { filename: 'stored.mp4' } },
    })

    await fileSource.readFileBytes({ numberOfBytes: 1, startByte: 0 })

    expect(handlerSpy.mock.calls[0]![1].params).toMatchObject({
      collection: 'media',
      filename: 'stored.mp4',
      uploadReference: { prefix: '' },
    })
  })
})
