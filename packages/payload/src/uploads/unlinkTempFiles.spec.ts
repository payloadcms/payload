import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const unlinkMock = vi.fn().mockResolvedValue(undefined)

vi.mock('fs/promises', () => ({
  default: { unlink: unlinkMock },
}))

const { unlinkTempFiles } = await import('./unlinkTempFiles.js')

const collectionConfig = { upload: {} } as unknown as SanitizedCollectionConfig

const createReq = (tempFilePath: string, uploadReference?: unknown): PayloadRequest =>
  ({
    file: {
      data: Buffer.alloc(0),
      mimetype: 'video/mp4',
      name: 'video.mp4',
      size: 10,
      tempFilePath,
      ...(uploadReference ? { uploadReference } : {}),
    },
  }) as unknown as PayloadRequest

describe('unlinkTempFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes a temp file created from a client-upload reference even when global useTempFiles is off', async () => {
    const req = createReq('/tmp/payload-client-upload-abc', { key: 'media/video.mp4' })

    await unlinkTempFiles({
      collectionConfig,
      config: { upload: { useTempFiles: false } } as unknown as SanitizedConfig,
      req,
    })

    expect(unlinkMock).toHaveBeenCalledWith('/tmp/payload-client-upload-abc')
  })

  it('does not delete an unrelated temp file when useTempFiles is off and there is no upload reference', async () => {
    const req = createReq('/tmp/some-other-temp-file')

    await unlinkTempFiles({
      collectionConfig,
      config: { upload: { useTempFiles: false } } as unknown as SanitizedConfig,
      req,
    })

    expect(unlinkMock).not.toHaveBeenCalled()
  })

  it('still deletes temp files for regular multipart uploads when useTempFiles is on', async () => {
    const req = createReq('/tmp/multipart-temp-file')

    await unlinkTempFiles({
      collectionConfig,
      config: { upload: { useTempFiles: true } } as unknown as SanitizedConfig,
      req,
    })

    expect(unlinkMock).toHaveBeenCalledWith('/tmp/multipart-temp-file')
  })
})
