import type { PayloadRequest } from '../types/index.js'
import type { UploadInstructions } from './types.js'

import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HEADER_PROBE_BYTE_LENGTH } from './getFileContentRequirement.js'
import { getFileFromUploadInstructions } from './getFileFromUploadInstructions.js'

// A minimal valid 1x1 transparent PNG, small enough that a header-only fetch gets all of it.
const MINIMAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
  'base64',
)

const createReq = (
  handlers: Array<(...args: any[]) => any>,
  uploadConfigOverrides: Record<string, unknown> = { mimeTypes: ['video/*'] },
): PayloadRequest =>
  ({
    payload: {
      collections: {
        media: {
          config: {
            upload: {
              disableLocalStorage: true,
              handlers,
              ...uploadConfigOverrides,
            },
          },
        },
      },
      config: {
        upload: {},
      },
      logger: {
        error: vi.fn(),
      },
    },
    headers: new Headers(),
  }) as unknown as PayloadRequest

const createUploadReferenceFile = (
  overrides: Partial<UploadInstructions['file']> = {},
): UploadInstructions['file'] =>
  ({
    filename: 'video.mp4',
    mimeType: 'video/mp4',
    size: 18,
    uploadReference: { key: 'media/video.mp4' },
    ...overrides,
  }) as UploadInstructions['file']

describe('getFileFromUploadInstructions', () => {
  const tempFilesToClean: string[] = []

  afterEach(() => {
    for (const filePath of tempFilesToClean) {
      fs.rmSync(filePath, { force: true })
    }
    tempFilesToClean.length = 0
    vi.clearAllMocks()
  })

  it('streams the fetched file to a temp file instead of buffering it in memory', async () => {
    const handler = vi.fn(
      async () =>
        new Response('some file contents', {
          headers: { 'Content-Type': 'video/mp4' },
          status: 200,
        }),
    )

    const req = createReq([handler])
    const uploadReferenceFile = createUploadReferenceFile()

    const file = await getFileFromUploadInstructions({
      collectionSlug: 'media',
      file: uploadReferenceFile,
      req,
    })

    expect(file.tempFilePath).toBeTruthy()
    tempFilesToClean.push(file.tempFilePath!)

    expect(file.data.length).toBe(0)
    expect(fs.readFileSync(file.tempFilePath!, 'utf8')).toBe('some file contents')
    expect(file.uploadReference).toBe(uploadReferenceFile.uploadReference)
    expect(file.mimetype).toBe('video/mp4')
  })

  it('writes the temp file under the configured tempFileDir', async () => {
    const customTempDir = path.join(os.tmpdir(), `payload-test-temp-dir-${Date.now()}`)
    const handler = vi.fn(async () => new Response('x', { status: 200 }))
    const req = createReq([handler])
    req.payload.config.upload = { tempFileDir: customTempDir }

    const file = await getFileFromUploadInstructions({
      collectionSlug: 'media',
      file: createUploadReferenceFile({ filename: 'x.bin', mimeType: 'application/octet-stream' }),
      req,
    })

    tempFilesToClean.push(file.tempFilePath!)
    expect(path.dirname(file.tempFilePath!)).toBe(customTempDir)

    fs.rmSync(customTempDir, { force: true, recursive: true })
  })

  it('throws when no handler returns a response with a body', async () => {
    const handler = vi.fn(async () => new Response(null, { status: 204 }))
    const req = createReq([handler])

    await expect(
      getFileFromUploadInstructions({
        collectionSlug: 'media',
        file: createUploadReferenceFile(),
        req,
      }),
    ).rejects.toThrow()
  })

  it('skips fetching entirely when nothing downstream needs the file content', async () => {
    const handler = vi.fn(async () => new Response('unused', { status: 200 }))
    const req = createReq([handler], {})

    const file = await getFileFromUploadInstructions({
      collectionSlug: 'media',
      file: createUploadReferenceFile(),
      req,
    })

    expect(handler).not.toHaveBeenCalled()
    expect(file.tempFilePath).toBeUndefined()
    expect(file.data.length).toBe(0)
    expect(file.size).toBe(18)
    expect(file.mimetype).toBe('video/mp4')
  })

  it('fetches only a bounded header for an image with no configured adjustments', async () => {
    const handler = vi.fn(async (handlerReq: PayloadRequest) => {
      expect(handlerReq.headers.get('range')).toBe(`bytes=0-${HEADER_PROBE_BYTE_LENGTH - 1}`)
      return new Response(MINIMAL_PNG, { headers: { 'Content-Type': 'image/png' }, status: 206 })
    })

    const req = createReq([handler], {})

    const file = await getFileFromUploadInstructions({
      collectionSlug: 'media',
      file: createUploadReferenceFile({
        filename: 'photo.png',
        mimeType: 'image/png',
        size: MINIMAL_PNG.length,
      }),
      req,
    })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(file.tempFilePath).toBeUndefined()
    expect(file.data.equals(MINIMAL_PNG)).toBe(true)
    expect(file.mimetype).toBe('image/png')
  })

  it('stops reading once it has enough bytes to probe dimensions, even if the handler ignores the range hint', async () => {
    const totalSize = HEADER_PROBE_BYTE_LENGTH * 4
    let cancelled = false
    let bytesProduced = 0

    const stream = new ReadableStream({
      cancel() {
        cancelled = true
      },
      pull(controller) {
        if (bytesProduced === 0) {
          controller.enqueue(MINIMAL_PNG)
          bytesProduced += MINIMAL_PNG.length
          return
        }
        if (bytesProduced >= totalSize) {
          controller.close()
          return
        }
        const chunkSize = Math.min(64 * 1024, totalSize - bytesProduced)
        controller.enqueue(new Uint8Array(chunkSize))
        bytesProduced += chunkSize
      },
    })

    const handler = vi.fn(
      async () => new Response(stream, { headers: { 'Content-Type': 'image/png' }, status: 200 }),
    )
    const req = createReq([handler], {})

    const file = await getFileFromUploadInstructions({
      collectionSlug: 'media',
      file: createUploadReferenceFile({
        filename: 'photo.png',
        mimeType: 'image/png',
        size: totalSize,
      }),
      req,
    })

    expect(file.tempFilePath).toBeUndefined()
    expect(file.data.length).toBeLessThanOrEqual(HEADER_PROBE_BYTE_LENGTH)
    expect(cancelled).toBe(true)
  })

  it('preserves native Request accessors like signal on the request passed to a range-scoped handler', async () => {
    const abortController = new AbortController()
    const baseRequest = new Request('http://localhost/api/media', {
      signal: abortController.signal,
    })

    let observedSignal: AbortSignal | null | undefined

    const handler = vi.fn(async (handlerReq: PayloadRequest) => {
      observedSignal = handlerReq.signal
      return new Response(MINIMAL_PNG, { headers: { 'Content-Type': 'image/png' }, status: 206 })
    })

    const req = Object.assign(baseRequest, {
      payload: {
        collections: {
          media: {
            config: {
              upload: {
                disableLocalStorage: true,
                handlers: [handler],
              },
            },
          },
        },
        config: {
          upload: {},
        },
        logger: {
          error: vi.fn(),
        },
      },
    }) as unknown as PayloadRequest

    const file = await getFileFromUploadInstructions({
      collectionSlug: 'media',
      file: createUploadReferenceFile({
        filename: 'photo.png',
        mimeType: 'image/png',
        size: MINIMAL_PNG.length,
      }),
      req,
    })

    // req.signal is the Request's own internal signal, which follows the one passed into the
    // constructor rather than being the same object - reading it without throwing, and it
    // reflecting an abort, is what proves the accessor still works on the scoped request.
    expect(observedSignal).toBeInstanceOf(AbortSignal)
    expect(observedSignal?.aborted).toBe(false)
    abortController.abort()
    expect(observedSignal?.aborted).toBe(true)
    expect(file.data.equals(MINIMAL_PNG)).toBe(true)
  })

  it('removes the partial temp file if the response stream fails partway through', async () => {
    const customTempDir = path.join(os.tmpdir(), `payload-test-stream-failure-${randomUUID()}`)
    const streamError = new Error('stream boom')

    const stream = new ReadableStream({
      pull(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]))
        controller.error(streamError)
      },
    })

    const handler = vi.fn(
      async () => new Response(stream, { headers: { 'Content-Type': 'video/mp4' }, status: 200 }),
    )

    const req = createReq([handler])
    req.payload.config.upload = { tempFileDir: customTempDir }

    await expect(
      getFileFromUploadInstructions({
        collectionSlug: 'media',
        file: createUploadReferenceFile(),
        req,
      }),
    ).rejects.toThrow('stream boom')

    const filesLeftBehind = await fs.promises.readdir(customTempDir).catch(() => [])
    expect(filesLeftBehind).toEqual([])

    await fs.promises.rm(customTempDir, { force: true, recursive: true })
  })

  it('falls back to a full fetch when the header is not enough to determine image dimensions', async () => {
    const garbage = Buffer.from('not a real image')
    let callCount = 0

    const handler = vi.fn(async (handlerReq: PayloadRequest) => {
      callCount += 1
      if (handlerReq.headers.get('range')) {
        return new Response(garbage, { headers: { 'Content-Type': 'image/png' }, status: 206 })
      }
      return new Response('full-image-bytes-stand-in', {
        headers: { 'Content-Type': 'image/png' },
        status: 200,
      })
    })

    const req = createReq([handler], {})

    const file = await getFileFromUploadInstructions({
      collectionSlug: 'media',
      file: createUploadReferenceFile({ filename: 'photo.png', mimeType: 'image/png', size: 26 }),
      req,
    })

    expect(callCount).toBe(2)
    expect(file.tempFilePath).toBeTruthy()
    tempFilesToClean.push(file.tempFilePath!)
    expect(fs.readFileSync(file.tempFilePath!, 'utf8')).toBe('full-image-bytes-stand-in')
  })
})
