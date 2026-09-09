import type { PayloadRequest } from '../types/index.js'
import type { SanitizedUploadConfig } from './types.js'

import fs from 'fs/promises'
import os from 'os'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HEADER_PROBE_BYTE_LENGTH } from './getFileContentRequirement.js'
import { type ClientUploadData, getFileFromClientUpload } from './getFileFromClientUpload.js'
import { getImageSize } from './getImageSize.js'

const MINIMAL_PNG = (() => {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(400, 0) // width
  ihdrData.writeUInt32BE(300, 4) // height
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 2 // color type: RGB
  const ihdrChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 13]),
    Buffer.from('IHDR'),
    ihdrData,
    Buffer.alloc(4), // crc (unchecked by dimension probing)
  ])
  return Buffer.concat([signature, ihdrChunk])
})()

const tempFilesToRemove: string[] = []

afterEach(async () => {
  vi.unstubAllGlobals()
  for (const tempFilePath of tempFilesToRemove) {
    await fs.rm(tempFilePath, { force: true })
  }
  tempFilesToRemove.length = 0
})

const createReq = ({
  handlers,
  upload,
}: {
  handlers: NonNullable<SanitizedUploadConfig['handlers']>
  upload?: Partial<SanitizedUploadConfig>
}): PayloadRequest => {
  const request = new Request('http://localhost/api/media')
  const req = request as unknown as PayloadRequest

  req.query = {}
  req.payload = {
    collections: {
      media: {
        config: {
          upload: {
            disableLocalStorage: true,
            handlers,
            ...upload,
          },
        },
      },
    },
    config: {
      upload: {},
    },
    logger: { error: vi.fn() },
  } as unknown as PayloadRequest['payload']

  return req
}

const videoFile = (overrides: Partial<ClientUploadData> = {}): ClientUploadData => ({
  clientUploadContext: { prefix: 'abc' },
  collectionSlug: 'media',
  filename: 'clip.mp4',
  mimeType: 'video/mp4',
  size: 10,
  ...overrides,
})

const imageFile = (overrides: Partial<ClientUploadData> = {}): ClientUploadData => ({
  clientUploadContext: { prefix: 'abc' },
  collectionSlug: 'media',
  filename: 'photo.png',
  mimeType: 'image/png',
  size: MINIMAL_PNG.length,
  ...overrides,
})

describe('getFileFromClientUpload', () => {
  it('does not call a handler and returns empty data with an own clientUploadContext property when no content is required', async () => {
    const handler = vi.fn()
    const req = createReq({ handlers: [handler], upload: { disableLocalStorage: true } })
    const file = videoFile()

    const result = await getFileFromClientUpload({ file, req })

    expect(handler).not.toHaveBeenCalled()
    expect(Object.prototype.hasOwnProperty.call(result, 'clientUploadContext')).toBe(true)
    expect(result.clientUploadContext).toEqual({ prefix: 'abc' })
    expect(result.data.length).toBe(0)
    expect(result.tempFilePath).toBeUndefined()
    expect(result.name).toBe('clip.mp4')
    expect(result.size).toBe(10)
  })

  it('requests a bounded byte range and returns dimensions for a header-only image', async () => {
    const handler = vi.fn(async (handlerReq: PayloadRequest) => {
      expect(handlerReq.headers.get('Range')).toBe(`bytes=0-${HEADER_PROBE_BYTE_LENGTH - 1}`)
      return new Response(MINIMAL_PNG, {
        headers: { 'Content-Type': 'image/png' },
        status: 206,
      })
    })
    const req = createReq({ handlers: [handler], upload: { disableLocalStorage: true } })
    const file = imageFile()

    const result = await getFileFromClientUpload({ file, req })

    expect(result.data.length).toBeLessThanOrEqual(HEADER_PROBE_BYTE_LENGTH)
    expect(result.tempFilePath).toBeUndefined()
    await expect(getImageSize({ file: result })).resolves.toEqual({ height: 300, width: 400 })
  })

  it('caps the header read at the boundary and cancels the stream without pulling past it', async () => {
    let hasCancelled = false
    let hasReadPastBoundary = false
    const firstChunk = Buffer.concat([
      MINIMAL_PNG,
      Buffer.alloc(HEADER_PROBE_BYTE_LENGTH - MINIMAL_PNG.length),
    ])
    const stream = new ReadableStream(
      {
        cancel() {
          hasCancelled = true
        },
        pull(controller) {
          hasReadPastBoundary = true
          controller.error(new Error('Read past header boundary'))
        },
        start(controller) {
          controller.enqueue(firstChunk)
        },
      },
      { highWaterMark: 0 },
    )

    const handler = vi.fn(
      async () => new Response(stream, { headers: { 'Content-Type': 'image/png' }, status: 206 }),
    )
    const req = createReq({ handlers: [handler], upload: { disableLocalStorage: true } })
    const file = imageFile({ size: HEADER_PROBE_BYTE_LENGTH })

    const result = await getFileFromClientUpload({ file, req })

    expect(result.data.length).toBe(HEADER_PROBE_BYTE_LENGTH)
    expect(hasCancelled).toBe(true)
    expect(hasReadPastBoundary).toBe(false)
  })

  it('lets a handler read native Request properties like signal through the Range-scoped proxy', async () => {
    const handler = vi.fn(async (handlerReq: PayloadRequest) => {
      expect(() => handlerReq.signal).not.toThrow()
      expect(handlerReq.signal).toBeInstanceOf(AbortSignal)
      return new Response(MINIMAL_PNG, {
        headers: { 'Content-Type': 'image/png' },
        status: 206,
      })
    })
    const req = createReq({ handlers: [handler], upload: { disableLocalStorage: true } })
    const file = imageFile()

    await getFileFromClientUpload({ file, req })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('falls back to a full fetch when the bounded header cannot be probed for dimensions', async () => {
    const handler = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(Buffer.from('not an image'), {
          headers: { 'Content-Type': 'image/png' },
          status: 206,
        }),
      )
      .mockResolvedValueOnce(
        new Response(MINIMAL_PNG, { headers: { 'Content-Type': 'image/png' }, status: 200 }),
      )
    const req = createReq({ handlers: [handler], upload: { disableLocalStorage: true } })
    const file = imageFile()

    const result = await getFileFromClientUpload({ file, req })
    tempFilesToRemove.push(result.tempFilePath!)

    expect(handler).toHaveBeenCalledTimes(2)
    expect(result.tempFilePath).toBeDefined()
    expect(result.data.length).toBe(0)
  })

  it('streams a full-content response to a temp file without buffering the whole body', async () => {
    const chunks = [
      Buffer.from('chunk-one-'),
      Buffer.from('chunk-two-'),
      Buffer.from('chunk-three'),
    ]
    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(chunk)
        }
        controller.close()
      },
    })

    const response = new Response(stream, {
      headers: { 'Content-Type': 'video/mp4' },
      status: 200,
    })
    const arrayBufferTripwire = vi.fn(async () => {
      throw new Error('Unexpected whole-body buffering')
    })
    Object.defineProperty(response, 'arrayBuffer', { value: arrayBufferTripwire })

    const handler = vi.fn(async () => response)
    const req = createReq({
      handlers: [handler],
      upload: { disableLocalStorage: true, mimeTypes: ['video/*'] },
    })
    const file = videoFile({ size: 30 })

    const result = await getFileFromClientUpload({ file, req })
    tempFilesToRemove.push(result.tempFilePath!)

    expect(result.data).toEqual(Buffer.alloc(0))
    expect(arrayBufferTripwire).not.toHaveBeenCalled()
    const written = await fs.readFile(result.tempFilePath!)
    expect(written.toString()).toBe(chunks.map((chunk) => chunk.toString()).join(''))
  })

  it('runs every handler and uses the last one that returns a response, matching v3', async () => {
    const firstHandler = vi.fn(async () => new Response(Buffer.from('first-response')))
    const secondHandler = vi.fn(async () => new Response(Buffer.from('second-response')))
    const req = createReq({
      handlers: [firstHandler, secondHandler],
      upload: { disableLocalStorage: true, mimeTypes: ['video/*'] },
    })
    const file = videoFile()

    const result = await getFileFromClientUpload({ file, req })
    tempFilesToRemove.push(result.tempFilePath!)

    expect(firstHandler).toHaveBeenCalledTimes(1)
    expect(secondHandler).toHaveBeenCalledTimes(1)
    const written = await fs.readFile(result.tempFilePath!)
    expect(written.toString()).toBe('second-response')
  })

  it('falls through to the next handler when the first returns nothing', async () => {
    const firstHandler = vi.fn(async () => undefined)
    const secondHandler = vi.fn(async () => new Response(Buffer.alloc(10), { status: 200 }))
    const req = createReq({
      handlers: [firstHandler, secondHandler],
      upload: { disableLocalStorage: true, mimeTypes: ['video/*'] },
    })
    const file = videoFile()

    const result = await getFileFromClientUpload({ file, req })
    tempFilesToRemove.push(result.tempFilePath!)

    expect(firstHandler).toHaveBeenCalledTimes(1)
    expect(secondHandler).toHaveBeenCalledTimes(1)
  })

  it('follows exactly one redirect from a handler response', async () => {
    const redirectTarget = 'http://storage.example.com/file.mp4'
    const handler = vi.fn(
      async () => new Response(null, { headers: { Location: redirectTarget }, status: 302 }),
    )
    const fetchMock = vi.fn(
      async () =>
        new Response(Buffer.alloc(10), { headers: { 'Content-Type': 'video/mp4' }, status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const req = createReq({
      handlers: [handler],
      upload: { disableLocalStorage: true, mimeTypes: ['video/*'] },
    })
    const file = videoFile()

    const result = await getFileFromClientUpload({ file, req })
    tempFilesToRemove.push(result.tempFilePath!)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(redirectTarget)
  })

  it('forwards the Range header through a redirect during the bounded header probe', async () => {
    const redirectTarget = 'http://storage.example.com/photo.png'
    const handler = vi.fn(
      async () => new Response(null, { headers: { Location: redirectTarget }, status: 302 }),
    )
    const fetchMock = vi.fn(
      async () =>
        new Response(MINIMAL_PNG, { headers: { 'Content-Type': 'image/png' }, status: 206 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const req = createReq({ handlers: [handler], upload: { disableLocalStorage: true } })
    const file = imageFile()

    const result = await getFileFromClientUpload({ file, req })

    expect(result.tempFilePath).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(redirectTarget, {
      headers: { Range: `bytes=0-${HEADER_PROBE_BYTE_LENGTH - 1}` },
    })
  })

  it('removes the partial temp file when the stream fails before completion', async () => {
    const stream = new ReadableStream({
      pull(controller) {
        controller.error(new Error('stream broke'))
      },
      start(controller) {
        controller.enqueue(Buffer.from('partial-chunk'))
      },
    })
    const handler = vi.fn(
      async () => new Response(stream, { headers: { 'Content-Type': 'video/mp4' }, status: 200 }),
    )
    const req = createReq({
      handlers: [handler],
      upload: { disableLocalStorage: true, mimeTypes: ['video/*'] },
    })
    const file = videoFile()

    const tempFileDir = os.tmpdir()
    const filesBefore = new Set(await fs.readdir(tempFileDir))

    await expect(getFileFromClientUpload({ file, req })).rejects.toThrow('stream broke')

    const filesAfter = await fs.readdir(tempFileDir)
    const leftoverTempFiles = filesAfter.filter(
      (entry) => !filesBefore.has(entry) && entry.startsWith('payload-client-upload-'),
    )
    expect(leftoverTempFiles).toEqual([])
  })

  it('requires full content and skips the Range header when the request carries crop or size edits', async () => {
    const handler = vi.fn(async (handlerReq: PayloadRequest) => {
      expect(handlerReq.headers.get('Range')).toBeNull()
      return new Response(MINIMAL_PNG, { headers: { 'Content-Type': 'image/png' }, status: 200 })
    })
    const req = createReq({ handlers: [handler], upload: { disableLocalStorage: true } })
    req.query = { uploadEdits: { heightInPixels: 100, widthInPixels: 100 } }
    const file = imageFile()

    const result = await getFileFromClientUpload({ file, req })
    tempFilesToRemove.push(result.tempFilePath!)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(result.tempFilePath).toBeDefined()
    expect(result.data.length).toBe(0)
  })

  it('treats a null response body as a legitimate zero-byte file', async () => {
    const handler = vi.fn(
      async () => new Response(null, { headers: { 'Content-Type': 'video/mp4' }, status: 200 }),
    )
    const req = createReq({
      handlers: [handler],
      upload: { disableLocalStorage: true, mimeTypes: ['video/*'] },
    })
    const file = videoFile({ size: 0 })

    const result = await getFileFromClientUpload({ file, req })
    tempFilesToRemove.push(result.tempFilePath!)

    expect(result.tempFilePath).toBeDefined()
    const written = await fs.readFile(result.tempFilePath!)
    expect(written.length).toBe(0)
  })

  it('streams the full file to disk when a non-image client upload carries no context', async () => {
    const handler = vi.fn(
      async () =>
        new Response(Buffer.from('full-video-bytes'), {
          headers: { 'Content-Type': 'video/mp4' },
          status: 200,
        }),
    )
    const req = createReq({ handlers: [handler], upload: { disableLocalStorage: true } })
    const file = videoFile({ clientUploadContext: undefined })

    const result = await getFileFromClientUpload({ file, req })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(result.tempFilePath).toBeDefined()
    tempFilesToRemove.push(result.tempFilePath!)

    const written = await fs.readFile(result.tempFilePath!)
    expect(written.toString()).toBe('full-video-bytes')
  })

  it('streams the full file to disk when an image client upload carries no context', async () => {
    const handler = vi.fn(async (handlerReq: PayloadRequest) => {
      expect(handlerReq.headers.get('Range')).toBeNull()
      return new Response(MINIMAL_PNG, { headers: { 'Content-Type': 'image/png' }, status: 200 })
    })
    const req = createReq({ handlers: [handler], upload: { disableLocalStorage: true } })
    const file = imageFile({ clientUploadContext: undefined })

    const result = await getFileFromClientUpload({ file, req })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(result.tempFilePath).toBeDefined()
    tempFilesToRemove.push(result.tempFilePath!)

    const written = await fs.readFile(result.tempFilePath!)
    expect(written).toEqual(MINIMAL_PNG)
  })
})
