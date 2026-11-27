import type { UploadTransferProgress } from 'payload'

import { uploadRequest } from '@payloadcms/plugin-cloud-storage/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { R2ClientUploadHandler } from './R2ClientUploadHandler.js'

// The handler runs inside a React component in the Admin; here it is called directly.
vi.mock('@payloadcms/plugin-cloud-storage/client', () => ({
  createClientUploadHandler: ({ handler }: { handler: unknown }) => handler,
  uploadRequest: vi.fn(),
}))

type Handler = (args: Record<string, unknown>) => Promise<unknown>

const handler = R2ClientUploadHandler as unknown as Handler
const uploadReference = { prefix: 'media', signedReceipt: 'receipt' }

const runHandler = ({
  file,
  onProgress = vi.fn(),
}: {
  file: File
  onProgress?: (progress: UploadTransferProgress) => void
}) =>
  handler({
    apiRoute: '/api',
    collectionSlug: 'media',
    endpointPath: '/storage-r2-multipart',
    file,
    onProgress,
    props: { chunkSize: 5 },
    serverURL: 'http://localhost:3000',
    updateFilename: vi.fn(),
  })

/** Answers each part with half its bytes, then all of them, like a browser sending it. */
const sendPartsInTwoSteps = () =>
  vi.mocked(uploadRequest).mockImplementation(async ({ body, onProgress, url }) => {
    const size = (body as Blob).size
    const partNumber = Number(new URL(url).searchParams.get('multipartNumber'))

    onProgress?.({ loadedBytes: Math.floor(size / 2), totalBytes: size })
    onProgress?.({ loadedBytes: size, totalBytes: size })

    return Response.json({ etag: `etag-${partNumber}`, partNumber })
  })

describe('R2ClientUploadHandler', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchMock.mockImplementation(async (input) => {
      const url = new URL(String(input))

      // Before there is an upload id, the request starts the multipart upload.
      if (!url.searchParams.has('multipartId')) {
        return Response.json({ key: 'media/video.mp4', uploadId: 'upload-1', uploadReference })
      }

      return new Response(null, { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.mocked(uploadRequest).mockReset()
  })

  it('should report finished parts plus the current one, ending at the file size', async () => {
    const onProgress = vi.fn<(progress: UploadTransferProgress) => void>()

    sendPartsInTwoSteps()
    await runHandler({ file: new File(['a'.repeat(12)], 'video.mp4'), onProgress })

    expect(onProgress.mock.calls.map(([progress]) => progress)).toEqual([
      { loadedBytes: 2, totalBytes: 12 },
      { loadedBytes: 5, totalBytes: 12 },
      { loadedBytes: 7, totalBytes: 12 },
      { loadedBytes: 10, totalBytes: 12 },
      { loadedBytes: 11, totalBytes: 12 },
      { loadedBytes: 12, totalBytes: 12 },
    ])
  })

  it('should send each part in order and complete with every uploaded part', async () => {
    sendPartsInTwoSteps()

    const result = await runHandler({ file: new File(['a'.repeat(12)], 'video.mp4') })
    const partRequests = vi
      .mocked(uploadRequest)
      .mock.calls.map(([args]: Parameters<typeof uploadRequest>) => ({
        method: args.method,
        number: new URL(args.url).searchParams.get('multipartNumber'),
        size: (args.body as Blob).size,
      }))
    const completeRequest = fetchMock.mock.calls.at(-1)

    expect(partRequests).toEqual([
      { method: 'POST', number: '1', size: 5 },
      { method: 'POST', number: '2', size: 5 },
      { method: 'POST', number: '3', size: 2 },
    ])
    expect(JSON.parse(String(completeRequest?.[1]?.body))).toEqual([
      { etag: 'etag-1', partNumber: 1 },
      { etag: 'etag-2', partNumber: 2 },
      { etag: 'etag-3', partNumber: 3 },
    ])
    expect(result).toEqual(uploadReference)
  })

  it('should stop at a rejected part without completing the upload', async () => {
    vi.mocked(uploadRequest)
      .mockResolvedValueOnce(Response.json({ etag: 'etag-1', partNumber: 1 }))
      .mockResolvedValueOnce(new Response(null, { status: 500 }))

    await expect(runHandler({ file: new File(['a'.repeat(12)], 'video.mp4') })).rejects.toThrow(
      'Failed to upload part 2 / 3',
    )

    expect(uploadRequest).toHaveBeenCalledTimes(2)
    // Only the request that started the upload: the completion request is never sent.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
