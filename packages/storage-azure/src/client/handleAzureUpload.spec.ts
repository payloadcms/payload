import { beforeEach, describe, expect, it, vi } from 'vitest'

const uploadDataMock = vi.fn()
const blockBlobClientMock = vi.fn(function () {
  return { uploadData: uploadDataMock }
})
const { uploadRequestMock } = vi.hoisted(() => ({ uploadRequestMock: vi.fn() }))

vi.mock('@azure/storage-blob', () => ({
  BlockBlobClient: blockBlobClientMock,
}))

vi.mock('@payloadcms/plugin-cloud-storage/client', () => ({
  uploadRequest: uploadRequestMock,
}))

import { handleAzureUpload } from './handleAzureUpload.js'

const signedURL = 'https://account.blob.core.windows.net/container/file.png?sig=abc'

const createFile = () => new File([new Uint8Array([1, 2, 3])], 'file.png', { type: 'image/png' })

/** A file reporting a size above the single-request limit, without allocating it. */
const createLargeFile = () => {
  const file = createFile()

  Object.defineProperty(file, 'size', { value: 300 * 1024 * 1024 })

  return file
}

describe('handleAzureUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    uploadDataMock.mockResolvedValue(undefined)
    uploadRequestMock.mockResolvedValue(new Response(null, { status: 201 }))
  })

  describe('single request', () => {
    it('should send one Put Blob request with the content type', async () => {
      const file = createFile()

      await handleAzureUpload({ data: { url: signedURL }, file })

      expect(uploadRequestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          body: file,
          headers: { 'x-ms-blob-content-type': 'image/png', 'x-ms-blob-type': 'BlockBlob' },
          method: 'PUT',
          url: signedURL,
        }),
      )
      expect(blockBlobClientMock).not.toHaveBeenCalled()
    })

    it('should report the request progress to the caller', async () => {
      const onProgress = vi.fn()

      uploadRequestMock.mockImplementationOnce(({ onProgress: report }) => {
        report({ loadedBytes: 1, totalBytes: 3 })
        return Promise.resolve(new Response(null, { status: 201 }))
      })

      await handleAzureUpload({ data: { url: signedURL }, file: createFile(), onProgress })

      expect(onProgress).toHaveBeenCalledWith({ loadedBytes: 1, totalBytes: 3 })
    })

    it('should retry a temporary failure and keep progress from going backwards', async () => {
      vi.useFakeTimers()

      const onProgress = vi.fn()

      uploadRequestMock
        .mockImplementationOnce(({ onProgress: report }) => {
          report({ loadedBytes: 2, totalBytes: 3 })
          return Promise.resolve(new Response(null, { status: 503 }))
        })
        .mockImplementationOnce(({ onProgress: report }) => {
          report({ loadedBytes: 1, totalBytes: 3 })
          report({ loadedBytes: 3, totalBytes: 3 })
          return Promise.resolve(new Response(null, { status: 201 }))
        })

      const upload = handleAzureUpload({ data: { url: signedURL }, file: createFile(), onProgress })

      await vi.runAllTimersAsync()
      await upload
      vi.useRealTimers()

      expect(uploadRequestMock).toHaveBeenCalledTimes(2)
      expect(onProgress.mock.calls.map(([progress]) => progress.loadedBytes)).toEqual([2, 2, 3])
    })

    it('should retry a network failure', async () => {
      vi.useFakeTimers()

      uploadRequestMock
        .mockRejectedValueOnce(new Error('The upload failed because of a network error.'))
        .mockResolvedValueOnce(new Response(null, { status: 201 }))

      const upload = handleAzureUpload({ data: { url: signedURL }, file: createFile() })

      await vi.runAllTimersAsync()
      await upload
      vi.useRealTimers()

      expect(uploadRequestMock).toHaveBeenCalledTimes(2)
    })

    it('should give up after repeated temporary failures', async () => {
      vi.useFakeTimers()

      uploadRequestMock.mockResolvedValue(new Response(null, { status: 503 }))

      const upload = handleAzureUpload({ data: { url: signedURL }, file: createFile() }).catch(
        (err: unknown) => err,
      )

      await vi.runAllTimersAsync()
      vi.useRealTimers()

      expect(await upload).toMatchObject({ message: expect.stringContaining('status 503') })
      expect(uploadRequestMock).toHaveBeenCalledTimes(4)
    })

    it('should fail when Azure rejects the upload', async () => {
      uploadRequestMock.mockResolvedValue(new Response(null, { status: 403 }))

      await expect(
        handleAzureUpload({ data: { url: signedURL }, file: createFile() }),
      ).rejects.toThrow('status 403')
      expect(uploadRequestMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('block upload above the single-request limit', () => {
    it('should upload via BlockBlobClient.uploadData with the content type', async () => {
      const file = createLargeFile()

      await handleAzureUpload({ data: { url: signedURL }, file })

      expect(blockBlobClientMock).toHaveBeenCalledWith(signedURL)
      expect(uploadRequestMock).not.toHaveBeenCalled()

      const [uploadedFile, options] = uploadDataMock.mock.calls[0]!
      expect(uploadedFile).toBe(file)
      expect(options.blobHTTPHeaders).toEqual({ blobContentType: 'image/png' })
      expect(options.blockSize).toBeGreaterThan(0)
      expect(options.concurrency).toBeGreaterThan(0)
    })

    it('should propagate errors from uploadData', async () => {
      uploadDataMock.mockRejectedValue(new Error('block upload failed'))

      await expect(
        handleAzureUpload({ data: { url: signedURL }, file: createLargeFile() }),
      ).rejects.toThrow('block upload failed')
    })

    it('should report clamped, never decreasing progress', async () => {
      const onProgress = vi.fn()
      const file = createLargeFile()

      uploadDataMock.mockImplementation((_file, options) => {
        options.onProgress({ loadedBytes: 2 })
        options.onProgress({ loadedBytes: 1 })
        options.onProgress({ loadedBytes: file.size + 10 })
        return Promise.resolve()
      })

      await handleAzureUpload({ data: { url: signedURL }, file, onProgress })

      expect(onProgress.mock.calls.map(([progress]) => progress)).toEqual([
        { loadedBytes: 2, totalBytes: file.size },
        { loadedBytes: 2, totalBytes: file.size },
        { loadedBytes: file.size, totalBytes: file.size },
      ])
    })
  })
})
