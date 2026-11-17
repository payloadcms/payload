import { beforeEach, describe, expect, it, vi } from 'vitest'

const uploadDataMock = vi.fn()
const blockBlobClientMock = vi.fn(function () {
  return { uploadData: uploadDataMock }
})

vi.mock('@azure/storage-blob', () => ({
  BlockBlobClient: blockBlobClientMock,
}))

import { handleAzureUpload } from './handleAzureUpload.js'

const signedURL = 'https://account.blob.core.windows.net/container/file.png?sig=abc'

const createFile = () => new File([new Uint8Array([1, 2, 3])], 'file.png', { type: 'image/png' })

describe('handleAzureUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    uploadDataMock.mockResolvedValue(undefined)
  })

  it('should upload via BlockBlobClient.uploadData', async () => {
    const file = createFile()

    await handleAzureUpload({ data: { url: signedURL }, file })

    expect(blockBlobClientMock).toHaveBeenCalledWith(signedURL)
    expect(uploadDataMock).toHaveBeenCalledTimes(1)

    const [uploadedFile, options] = uploadDataMock.mock.calls[0]!
    expect(uploadedFile).toBe(file)
    expect(options.blockSize).toBeGreaterThan(0)
    expect(options.concurrency).toBeGreaterThan(0)
  })

  it('should pass the file content type to the blob headers', async () => {
    await handleAzureUpload({ data: { url: signedURL }, file: createFile() })

    const [, options] = uploadDataMock.mock.calls[0]!
    expect(options.blobHTTPHeaders).toEqual({ blobContentType: 'image/png' })
  })

  it('should propagate errors from uploadData', async () => {
    uploadDataMock.mockRejectedValue(new Error('block upload failed'))

    await expect(
      handleAzureUpload({ data: { url: signedURL }, file: createFile() }),
    ).rejects.toThrow('block upload failed')
  })

  it('should report clamped, never decreasing progress', async () => {
    const onProgress = vi.fn()

    uploadDataMock.mockImplementation((_file, options) => {
      options.onProgress({ loadedBytes: 2 })
      options.onProgress({ loadedBytes: 1 })
      options.onProgress({ loadedBytes: 10 })
      return Promise.resolve()
    })

    await handleAzureUpload({ data: { url: signedURL }, file: createFile(), onProgress })

    expect(onProgress.mock.calls.map(([progress]) => progress)).toEqual([
      { loadedBytes: 2, totalBytes: 3 },
      { loadedBytes: 2, totalBytes: 3 },
      { loadedBytes: 3, totalBytes: 3 },
    ])
  })
})
