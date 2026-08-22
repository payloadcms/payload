import type { Collection } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mkdirMock = vi.fn().mockResolvedValue(undefined)
const readFileMock = vi.fn().mockResolvedValue(Buffer.from('unused'))
const writeFileMock = vi.fn().mockResolvedValue(undefined)

vi.mock('fs/promises', () => ({
  default: {
    mkdir: mkdirMock,
    readFile: readFileMock,
    writeFile: writeFileMock,
  },
}))

const { generateFileData } = await import('./generateFileData.js')

const createCollection = (disableLocalStorage: boolean): Collection =>
  ({
    config: {
      slug: 'media',
      upload: {
        disableLocalStorage,
        staticDir: '/tmp/media',
      },
    },
  }) as unknown as Collection

const createReq = (tempFilePath: string, size: number): PayloadRequest =>
  ({
    file: {
      data: Buffer.alloc(0),
      mimetype: 'video/mp4',
      name: 'big-video.mp4',
      size,
      tempFilePath,
    },
    payload: {
      config: {},
      logger: { error: vi.fn() },
    },
  }) as unknown as PayloadRequest

describe('generateFileData - non-image temp file buffering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    readFileMock.mockResolvedValue(Buffer.from('unused'))
  })

  it('does not read or rewrite a temp file into memory when local storage is disabled', async () => {
    const req = createReq('/tmp/payload-client-upload-abc', 5_000_000_000)

    const result = await generateFileData({
      collection: createCollection(true),
      config: {} as SanitizedConfig,
      data: {},
      operation: 'create',
      overwriteExistingFiles: true,
      req,
    })

    expect(readFileMock).not.toHaveBeenCalled()
    expect(writeFileMock).not.toHaveBeenCalled()
    expect(result.files).toEqual([])
    expect(result.data).toMatchObject({ filesize: 5_000_000_000, mimeType: 'video/mp4' })
  })

  it('still reads and saves the temp file when local storage is enabled', async () => {
    readFileMock.mockResolvedValueOnce(Buffer.from('video-bytes'))
    const req = createReq('/tmp/payload-client-upload-def', 1234)

    const result = await generateFileData({
      collection: createCollection(false),
      config: {} as SanitizedConfig,
      data: {},
      operation: 'create',
      overwriteExistingFiles: true,
      req,
    })

    expect(readFileMock).toHaveBeenCalledWith('/tmp/payload-client-upload-def')
    expect(writeFileMock).toHaveBeenCalledWith(
      '/tmp/payload-client-upload-def',
      Buffer.from('video-bytes'),
    )
    expect(result.files).toEqual([
      { buffer: Buffer.from('video-bytes'), path: '/tmp/media/big-video.mp4' },
    ])
  })
})
