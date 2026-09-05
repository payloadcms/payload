import type { Payload } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const copyFileMock = vi.fn().mockResolvedValue(undefined)
const writeFileMock = vi.fn().mockResolvedValue(undefined)

vi.mock('fs/promises', () => ({
  default: {
    copyFile: copyFileMock,
    writeFile: writeFileMock,
  },
}))

const { uploadFiles } = await import('./uploadFiles.js')

describe('uploadFiles', () => {
  const payload = { logger: { error: vi.fn() } } as unknown as Payload
  const req = {} as unknown as PayloadRequest

  beforeEach(() => {
    vi.clearAllMocks()
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
      [{ path: '/tmp/media/video.mp4', sourcePath: '/tmp/payload-upload-abc' }],
      req,
    )

    expect(copyFileMock).toHaveBeenCalledWith('/tmp/payload-upload-abc', '/tmp/media/video.mp4')
    expect(writeFileMock).not.toHaveBeenCalled()
  })
})
