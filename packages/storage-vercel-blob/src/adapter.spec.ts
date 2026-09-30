import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ uploadFile: vi.fn(async () => ({})) }))

vi.mock('./uploadFile.js', () => ({ uploadFile: mocks.uploadFile }))

import { createVercelBlobAdapter } from './adapter.js'

describe('createVercelBlobAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    { clientUploads: true, isClientUpload: true, shouldAddRandomSuffix: false },
    { clientUploads: { access: () => true }, isClientUpload: true, shouldAddRandomSuffix: false },
    { clientUploads: true, isClientUpload: false, shouldAddRandomSuffix: true },
    { clientUploads: false, isClientUpload: false, shouldAddRandomSuffix: true },
  ])(
    'should use the suffix policy for clientUploads=$clientUploads and isClientUpload=$isClientUpload',
    async ({ clientUploads, isClientUpload, shouldAddRandomSuffix }) => {
      const adapter = createVercelBlobAdapter({
        access: 'public',
        addRandomSuffix: true,
        baseUrl: 'https://example.com',
        cacheControlMaxAge: 60,
        clientUploads,
        collectionSources: [],
        token: 'read-write-token',
      })({ collection: { slug: 'media' } } as never)

      for (const filename of ['image.png', 'image-30x20.png']) {
        await adapter.handleUpload({
          data: isClientUpload ? { _objectKey: 'upload-key' } : {},
          file: { buffer: Buffer.from('image'), filename, mimeType: 'image/png' },
          req: {
            context: isClientUpload
              ? { payloadClientUploadTempFilePath: '/tmp/client-upload' }
              : {},
            file: { tempFilePath: isClientUpload ? '/tmp/client-upload' : undefined },
          },
          storageFilePath: `upload-key/${filename}`,
        } as never)

        expect(mocks.uploadFile).toHaveBeenLastCalledWith(
          expect.objectContaining({
            addRandomSuffix: shouldAddRandomSuffix,
            storageFilePath: `upload-key/${filename}`,
          }),
        )
      }
    },
  )

  it('should retain suffixes for a later server upload using the same request', async () => {
    const adapter = createVercelBlobAdapter({
      access: 'public',
      addRandomSuffix: true,
      baseUrl: 'https://example.com',
      cacheControlMaxAge: 60,
      clientUploads: true,
      collectionSources: [],
      token: 'read-write-token',
    })({ collection: { slug: 'media' } } as never)
    const req = {
      context: { payloadClientUploadTempFilePath: '/tmp/client-upload' },
      file: { tempFilePath: '/tmp/client-upload' },
    }

    await adapter.handleUpload({
      data: { _objectKey: 'issued-key' },
      file: {
        buffer: Buffer.alloc(0),
        filename: 'processed.png',
        mimeType: 'image/png',
        tempFilePath: '/tmp/client-upload',
      },
      req,
      storageFilePath: 'issued-key/processed.png',
    } as never)
    await adapter.handleUpload({
      data: { _objectKey: 'issued-key' },
      file: { buffer: Buffer.from('size'), filename: 'processed-30x20.png', mimeType: 'image/png' },
      req,
      storageFilePath: 'issued-key/processed-30x20.png',
    } as never)
    await adapter.handleUpload({
      data: { _objectKey: 'existing-key' },
      file: { buffer: Buffer.from('server'), filename: 'server.png', mimeType: 'image/png' },
      req: { ...req, file: { tempFilePath: '/tmp/server-upload' } },
      storageFilePath: 'server.png',
    } as never)

    expect(mocks.uploadFile.mock.calls.map(([args]) => args.addRandomSuffix)).toEqual([
      false,
      false,
      true,
    ])
  })

  it('should keep the client-upload key when the file is preserved in request context', async () => {
    const adapter = createVercelBlobAdapter({
      access: 'public',
      addRandomSuffix: true,
      baseUrl: 'https://example.com',
      cacheControlMaxAge: 60,
      clientUploads: true,
      collectionSources: [],
      token: 'read-write-token',
    })({ collection: { slug: 'media' } } as never)

    await adapter.handleUpload({
      data: { _objectKey: 'issued-key' },
      file: { buffer: Buffer.alloc(0), filename: 'processed.png', mimeType: 'image/png' },
      req: {
        context: {
          payloadClientUploadTempFilePath: '/tmp/client-upload',
          _payloadCloudStorage: { file: { tempFilePath: '/tmp/client-upload' } },
        },
        file: undefined,
      },
      storageFilePath: 'issued-key/processed.png',
    } as never)

    expect(mocks.uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({ addRandomSuffix: false }),
    )
  })
})
