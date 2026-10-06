import type { Collection } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { UploadTransformer } from './transformers/types.js'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mkdirMock = vi.fn().mockResolvedValue(undefined)
const openAsBlobMock = vi.fn().mockResolvedValue(new Blob(['disk-backed-contents']))
const readFileMock = vi.fn().mockResolvedValue(Buffer.from('unused'))
const writeFileMock = vi.fn().mockResolvedValue(undefined)

vi.mock('node:fs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:fs')>()),
  openAsBlob: openAsBlobMock,
}))

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

const readStream = async (file: File): Promise<string> =>
  Buffer.from(await new Response(file.stream()).arrayBuffer()).toString()

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

  it('copies the temp file directly, without reading it into memory, when local storage is enabled', async () => {
    const req = createReq('/tmp/payload-client-upload-def', 5_000_000_000)

    const result = await generateFileData({
      collection: createCollection(false),
      config: {} as SanitizedConfig,
      data: {},
      operation: 'create',
      overwriteExistingFiles: true,
      req,
    })

    expect(readFileMock).not.toHaveBeenCalled()
    expect(writeFileMock).not.toHaveBeenCalled()
    expect(result.files).toEqual([
      { path: '/tmp/media/big-video.mp4', sourcePath: '/tmp/payload-client-upload-def' },
    ])
  })

  it('passes a disk-backed File to upload transformers without reading the temp file into memory', async () => {
    const transformFile = vi.fn<UploadTransformer['transformFile']>(async ({ file }) => {
      expect(await readStream(file)).toBe('disk-backed-contents')
      return { status: 'continue' }
    })
    const req = createReq('/tmp/payload-transformer-upload', 20)
    req.file = {
      ...req.file!,
      mimetype: 'application/octet-stream',
      name: 'disk-backed.bin',
    }
    req.payload.config.upload = {
      transformers: [
        {
          mimeTypes: ['*/*'],
          slug: 'stream-reader',
          transformFile,
        },
      ],
    }

    await generateFileData({
      collection: createCollection(true),
      config: {} as SanitizedConfig,
      data: {},
      operation: 'create',
      overwriteExistingFiles: true,
      req,
    })

    expect(transformFile).toHaveBeenCalledOnce()
    expect(openAsBlobMock).toHaveBeenCalledWith('/tmp/payload-transformer-upload')
    expect(readFileMock).not.toHaveBeenCalledWith('/tmp/payload-transformer-upload')
  })
})
