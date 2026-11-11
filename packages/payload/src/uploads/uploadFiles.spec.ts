import type { Payload } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FileUploadError } from '../errors/index.js'

const copyFileMock = vi.fn().mockResolvedValue(undefined)
const writeFileMock = vi.fn().mockResolvedValue(undefined)
const publishUploadedFileMock = vi.fn().mockResolvedValue(undefined)
const stageUploadFileRollbackMock = vi.fn()

vi.mock('fs/promises', () => ({
  default: {
    copyFile: copyFileMock,
    writeFile: writeFileMock,
  },
}))

vi.mock('./uploadFileRollback.js', () => ({
  publishUploadedFile: publishUploadedFileMock,
  stageUploadFileRollback: stageUploadFileRollbackMock,
}))

const { uploadFiles } = await import('./uploadFiles.js')

describe('uploadFiles', () => {
  const payload = { logger: { error: vi.fn() } } as unknown as Payload
  const req = {} as unknown as PayloadRequest

  beforeEach(() => {
    vi.clearAllMocks()
    stageUploadFileRollbackMock.mockImplementation(({ file }: { file: { path: string } }) => ({
      ...file,
      path: `${file.path}.staged`,
    }))
  })

  it('writes a buffer entry to disk', async () => {
    const buffer = Buffer.from('hello')

    await uploadFiles(payload, [{ buffer, path: '/tmp/media/hello.txt' }], req)

    expect(writeFileMock).toHaveBeenCalledWith('/tmp/media/hello.txt', buffer)
    expect(copyFileMock).not.toHaveBeenCalled()
  })

  it('copies a sourcePath entry directly, without reading it into memory', async () => {
    await uploadFiles(
      payload,
      [{ path: '/tmp/media/video.mp4', sourcePath: '/tmp/payload-client-upload-abc' }],
      req,
    )

    expect(copyFileMock).toHaveBeenCalledWith(
      '/tmp/payload-client-upload-abc',
      '/tmp/media/video.mp4',
    )
    expect(writeFileMock).not.toHaveBeenCalled()
  })

  it('should wait for every file write before reporting a failure', async () => {
    const writeError = new Error('First write failed')
    let releaseSecondWrite!: () => void
    const secondWrite = new Promise<void>((resolve) => {
      releaseSecondWrite = resolve
    })
    writeFileMock.mockRejectedValueOnce(writeError).mockReturnValueOnce(secondWrite)

    const uploadResult = uploadFiles(
      payload,
      [
        { buffer: Buffer.from('first'), path: '/tmp/media/first.txt' },
        { buffer: Buffer.from('second'), path: '/tmp/media/second.txt' },
      ],
      req,
    ).catch((error: unknown) => error)

    const uploadStatusBeforeSecondWrite = await Promise.race([
      uploadResult.then(() => 'settled'),
      new Promise<'pending'>((resolve) => {
        setImmediate(() => resolve('pending'))
      }),
    ])

    releaseSecondWrite()

    expect(uploadStatusBeforeSecondWrite).toBe('pending')
    expect(await uploadResult).toBeInstanceOf(FileUploadError)
  })

  it('should not publish any file when a private write fails', async () => {
    writeFileMock.mockRejectedValueOnce(new Error('First write failed'))

    await expect(
      uploadFiles(
        payload,
        [
          { buffer: Buffer.from('first'), path: '/tmp/media/first.txt' },
          { buffer: Buffer.from('second'), path: '/tmp/media/second.txt' },
        ],
        req,
        { uploadFileRollbacks: new Map() },
      ),
    ).rejects.toBeInstanceOf(FileUploadError)

    expect(publishUploadedFileMock).not.toHaveBeenCalled()
  })

  it('should publish duplicate and case-variant destinations sequentially in input order', async () => {
    let stagedFileIndex = 0
    let releaseFirstWrite!: () => void
    let releaseFirstPublish!: () => void
    const firstWrite = new Promise<void>((resolve) => {
      releaseFirstWrite = resolve
    })
    const firstPublish = new Promise<void>((resolve) => {
      releaseFirstPublish = resolve
    })

    stageUploadFileRollbackMock.mockImplementation(({ file }: { file: { path: string } }) => ({
      ...file,
      path: `${file.path}.${stagedFileIndex++}.staged`,
    }))

    writeFileMock.mockImplementation((filePath: string) =>
      filePath.endsWith('.0.staged') ? firstWrite : Promise.resolve(),
    )
    publishUploadedFileMock.mockImplementation(({ stagedFile }) =>
      stagedFile.path.endsWith('.0.staged') ? firstPublish : Promise.resolve(),
    )

    const uploadResult = uploadFiles(
      payload,
      [
        { buffer: Buffer.from('first'), path: '/tmp/media/shared.txt' },
        { buffer: Buffer.from('second'), path: '/tmp/media/SHARED.txt' },
        { buffer: Buffer.from('third'), path: '/tmp/media/shared.txt' },
      ],
      req,
      { uploadFileRollbacks: new Map() },
    )

    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(publishUploadedFileMock).not.toHaveBeenCalled()

    releaseFirstWrite()
    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(publishUploadedFileMock.mock.calls.map(([{ file }]) => file.path)).toEqual([
      '/tmp/media/shared.txt',
    ])

    releaseFirstPublish()
    await uploadResult

    expect(publishUploadedFileMock.mock.calls.map(([{ file }]) => file.path)).toEqual([
      '/tmp/media/shared.txt',
      '/tmp/media/SHARED.txt',
      '/tmp/media/shared.txt',
    ])
  })
})
