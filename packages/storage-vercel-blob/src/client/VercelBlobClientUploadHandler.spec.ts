import type { UploadTransferProgress } from 'payload'

import { put } from '@vercel/blob/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { VercelBlobClientUploadHandler } from './VercelBlobClientUploadHandler.js'

// The handler runs inside a React component in the Admin; here it is called directly.
vi.mock('@payloadcms/plugin-cloud-storage/client', () => ({
  createClientUploadHandler: ({ handler }: { handler: unknown }) => handler,
}))

vi.mock('@vercel/blob/client', () => ({
  put: vi.fn(),
}))

type Handler = (args: Record<string, unknown>) => Promise<unknown>

const handler = VercelBlobClientUploadHandler as unknown as Handler
const pathname = 'media/video.mp4'

const runHandler = ({
  file,
  onProgress = vi.fn(),
}: {
  file: File
  onProgress?: (progress: UploadTransferProgress) => void
}) => handler({ data: { pathname, token: 'client-token' }, file, onProgress })

/** Resolves like `put`, after reporting `loaded` values in the given order. */
const putReporting = ({
  loaded,
  storedPathname = pathname,
}: {
  loaded: number[]
  storedPathname?: string
}) =>
  vi.mocked(put).mockImplementation(async (_pathname, _body, options) => {
    for (const value of loaded) {
      options?.onUploadProgress?.({ loaded: value, percentage: 0, total: 0 })
    }

    return { pathname: storedPathname } as Awaited<ReturnType<typeof put>>
  })

describe('VercelBlobClientUploadHandler', () => {
  afterEach(() => {
    vi.mocked(put).mockReset()
  })

  it('should report progress that never goes backwards or past the file size', async () => {
    const onProgress = vi.fn<(progress: UploadTransferProgress) => void>()

    // Multipart uploads report parts as they finish, so a smaller value can arrive later.
    putReporting({ loaded: [6, 3, 15] })
    await runHandler({ file: new File(['a'.repeat(10)], 'video.mp4'), onProgress })

    expect(onProgress.mock.calls.map(([progress]) => progress.loadedBytes)).toEqual([6, 6, 10])
    expect(onProgress).toHaveBeenLastCalledWith({ loadedBytes: 10, totalBytes: 10 })
  })

  it('should send the file to its pathname with the client token and content type', async () => {
    const file = new File(['a'.repeat(10)], 'video.mp4', { type: 'video/mp4' })

    putReporting({ loaded: [] })
    await runHandler({ file })

    expect(put).toHaveBeenCalledWith(
      pathname,
      file,
      expect.objectContaining({
        access: 'public',
        contentType: 'video/mp4',
        token: 'client-token',
      }),
    )
  })

  it('should fail when the blob is stored at another pathname', async () => {
    putReporting({ loaded: [10], storedPathname: 'media/video-abc123.mp4' })

    await expect(runHandler({ file: new File(['a'.repeat(10)], 'video.mp4') })).rejects.toThrow(
      'The uploaded file was stored at an unexpected location',
    )
  })
})
