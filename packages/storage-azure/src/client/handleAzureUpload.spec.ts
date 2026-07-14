import { beforeEach, describe, expect, it, vi } from 'vitest'

const uploadDataMock = vi.fn()
const blockBlobClientMock = vi.fn(function () {
  return { uploadData: uploadDataMock }
})

vi.mock('@azure/storage-blob', () => ({
  BlockBlobClient: blockBlobClientMock,
}))

import { handleAzureUpload } from './handleAzureUpload.js'

const serverURL = 'https://example.com'
const apiRoute = '/api'
const serverHandlerPath = '/storage-azure-generate-signed-url' as const
const signedURL = 'https://account.blob.core.windows.net/container/file.png?sig=abc'

const createFile = () => new File([new Uint8Array([1, 2, 3])], 'file.png', { type: 'image/png' })

const mockSignedURLResponse = (body: Record<string, unknown>, ok = true) => {
  const fetchMock = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(body),
    ok,
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const invoke = (overrides: Partial<Parameters<typeof handleAzureUpload>[0]> = {}) =>
  handleAzureUpload({
    apiRoute,
    chunkLargeFiles: true,
    collectionSlug: 'media',
    file: createFile(),
    serverHandlerPath,
    serverURL,
    updateFilename: vi.fn(),
    ...overrides,
  })

describe('handleAzureUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    uploadDataMock.mockResolvedValue(undefined)
  })

  describe('shared behavior', () => {
    it('should request a signed URL from the server handler', async () => {
      const fetchMock = mockSignedURLResponse({ docPrefix: 'docs', url: signedURL })

      await invoke({ docPrefix: 'docs' })

      const [calledURL, init] = fetchMock.mock.calls[0]!
      expect(calledURL).toBe(`${serverURL}${apiRoute}${serverHandlerPath}`)
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body)).toEqual({
        collectionSlug: 'media',
        docPrefix: 'docs',
        filename: 'file.png',
        mimeType: 'image/png',
      })
    })

    it('should call updateFilename when the server returns a sanitized filename', async () => {
      mockSignedURLResponse({ docPrefix: 'docs', filename: 'file-1.png', url: signedURL })
      const updateFilename = vi.fn()

      await invoke({ updateFilename })

      expect(updateFilename).toHaveBeenCalledWith('file-1.png')
    })

    it('should not call updateFilename when the filename is unchanged', async () => {
      mockSignedURLResponse({ docPrefix: 'docs', filename: 'file.png', url: signedURL })
      const updateFilename = vi.fn()

      await invoke({ updateFilename })

      expect(updateFilename).not.toHaveBeenCalled()
    })

    it('should return the sanitized doc prefix', async () => {
      mockSignedURLResponse({ docPrefix: 'sanitized-docs', url: signedURL })

      const result = await invoke()

      expect(result).toEqual({ prefix: 'sanitized-docs' })
    })

    it('should throw when the signed URL request fails, before any upload', async () => {
      mockSignedURLResponse({}, false)

      await expect(invoke()).rejects.toThrow()

      expect(uploadDataMock).not.toHaveBeenCalled()
      expect(blockBlobClientMock).not.toHaveBeenCalled()
    })
  })

  describe('chunkLargeFiles: true (SDK block upload)', () => {
    it('should upload via BlockBlobClient.uploadData rather than a raw PUT', async () => {
      const fetchMock = mockSignedURLResponse({ docPrefix: 'docs', url: signedURL })
      const file = createFile()

      await invoke({ chunkLargeFiles: true, file })

      expect(blockBlobClientMock).toHaveBeenCalledWith(signedURL)
      expect(uploadDataMock).toHaveBeenCalledTimes(1)

      const [uploadedFile, options] = uploadDataMock.mock.calls[0]!
      expect(uploadedFile).toBe(file)
      expect(options.blockSize).toBeGreaterThan(0)
      expect(options.concurrency).toBeGreaterThan(0)

      // Only the signed-URL request should hit fetch; no raw PUT to the blob URL.
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('should pass the file content type to the blob headers', async () => {
      mockSignedURLResponse({ docPrefix: 'docs', url: signedURL })

      await invoke({ chunkLargeFiles: true })

      const [, options] = uploadDataMock.mock.calls[0]!
      expect(options.blobHTTPHeaders).toEqual({ blobContentType: 'image/png' })
    })

    it('should propagate errors from uploadData', async () => {
      mockSignedURLResponse({ docPrefix: 'docs', url: signedURL })
      uploadDataMock.mockRejectedValue(new Error('block upload failed'))

      await expect(invoke({ chunkLargeFiles: true })).rejects.toThrow('block upload failed')
    })
  })

  describe('chunkLargeFiles: false (single PUT, default/legacy)', () => {
    it('should upload via a single raw PUT with the BlockBlob header', async () => {
      const fetchMock = mockSignedURLResponse({ docPrefix: 'docs', url: signedURL })
      const file = createFile()

      await invoke({ chunkLargeFiles: false, file })

      // 1st fetch = signed-URL POST, 2nd = the raw PUT to the blob URL
      expect(fetchMock).toHaveBeenCalledTimes(2)
      const [putURL, putInit] = fetchMock.mock.calls[1]!
      expect(putURL).toBe(signedURL)
      expect(putInit.method).toBe('PUT')
      expect(putInit.body).toBe(file)
      expect(putInit.headers['x-ms-blob-type']).toBe('BlockBlob')
      expect(putInit.headers['Content-Type']).toBe('image/png')
    })

    it('should not use the Azure SDK', async () => {
      mockSignedURLResponse({ docPrefix: 'docs', url: signedURL })

      await invoke({ chunkLargeFiles: false })

      expect(blockBlobClientMock).not.toHaveBeenCalled()
      expect(uploadDataMock).not.toHaveBeenCalled()
    })
  })
})
