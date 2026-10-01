import type { PayloadRequest } from 'payload'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  generateClientToken: vi.fn(async () => 'client-token'),
  uploadFile: vi.fn(async () => ({})),
  // Resolves the stored location of an owning document, so it matches the requested key.
  buildStoragePathData: vi.fn(() => ({
    storageFilePath: 'reference.png',
    sanitizedCollectionPrefix: '',
    sanitizedDocPrefix: '',
    sanitizedFilename: 'reference.png',
  })),
  buildUploadStoragePathData: vi.fn(() => ({
    storageFilePath: 'reference.png',
    sanitizedCollectionPrefix: '',
    sanitizedDocPrefix: '',
    sanitizedFilename: 'reference.png',
  })),
  isStoragePathWithinCollectionPrefix: vi.fn(() => true),
  resolveSignedURLKey: vi.fn(async () => ({
    storageFilePath: 'reference-1.png',
    sanitizedDocPrefix: '',
    sanitizedFilename: 'reference-1.png',
    uploadReference: { prefix: '', signedReceipt: 'upload-receipt' },
  })),
}))

vi.mock('@payloadcms/plugin-cloud-storage/utilities', () => ({
  buildStoragePathData: mocks.buildStoragePathData,
  buildUploadStoragePathData: mocks.buildUploadStoragePathData,
  isStoragePathWithinCollectionPrefix: mocks.isStoragePathWithinCollectionPrefix,
  resolveSignedURLKey: mocks.resolveSignedURLKey,
}))

vi.mock('@vercel/blob/client', () => ({
  generateClientTokenFromReadWriteToken: mocks.generateClientToken,
}))

vi.mock('./uploadFile.js', () => ({ uploadFile: mocks.uploadFile }))

import { createVercelBlobAdapter } from './adapter.js'

const generateInstructions = async ({ hasOwner }: { hasOwner: boolean }) => {
  const adapter = createVercelBlobAdapter({
    access: 'public',
    baseUrl: 'https://example.com',
    cacheControlMaxAge: 60,
    clientUploads: true,
    collectionSources: [
      { collectionPrefix: '', collectionSlug: 'media', useCompositePrefixes: false },
    ],
    token: 'read-write-token',
  })
  const generatedAdapter = adapter({
    collection: { slug: 'media' },
    prefix: '',
  } as never)
  const req = {
    payload: {
      collections: {
        media: { config: { access: { update: async () => true }, upload: true } },
      },
      find: vi.fn(async () => ({
        docs: hasOwner ? [{ filename: 'reference.png', id: 1 }] : [],
      })),
      secret: 'secret',
    },
    t: vi.fn(),
  } as unknown as PayloadRequest

  return generatedAdapter.uploadInstructions?.generate({
    collectionSlug: 'media',
    filename: 'reference.png',
    filesize: 100,
    mimeType: 'image/png',
    overrideAccess: true,
    req,
  })
}

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
          file: {
            buffer: Buffer.from('image'),
            filename,
            mimeType: 'image/png',
            clientUpload: isClientUpload
              ? { isProcessed: true, originalStorageFilePath: 'upload-key/image.png' }
              : undefined,
          },
          req: {
            context: {
              _payloadClientUploadTempFile: isClientUpload ? '/tmp/client-upload' : undefined,
            },
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
      context: { _payloadClientUploadTempFile: '/tmp/client-upload' },
      file: { tempFilePath: '/tmp/client-upload' },
    }

    await adapter.handleUpload({
      data: { _objectKey: 'issued-key' },
      file: {
        clientUpload: { isProcessed: true, originalStorageFilePath: 'issued-key/processed.png' },
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
      file: {
        clientUpload: { isProcessed: true, originalStorageFilePath: 'issued-key/processed.png' },
        buffer: Buffer.from('size'),
        filename: 'processed-30x20.png',
        mimeType: 'image/png',
      },
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

  it('should keep a legacy client-upload key without object-key or request-context inference', async () => {
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
      data: {},
      file: {
        clientUpload: { isProcessed: true, originalStorageFilePath: 'processed.png' },
        buffer: Buffer.alloc(0),
        filename: 'processed.png',
        mimeType: 'image/png',
      },
      req: {},
      storageFilePath: 'issued-key/processed.png',
    } as never)

    expect(mocks.uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({ addRandomSuffix: false }),
    )
  })

  it('should disable overwrite when no document owns the requested key', async () => {
    const instructions = await generateInstructions({ hasOwner: false })
    const tokenOptions = mocks.generateClientToken.mock.calls[0]![0]

    expect(instructions).toMatchObject({ data: { pathname: 'reference-1.png' } })
    expect(tokenOptions).not.toHaveProperty('allowOverwrite')
  })

  it('should allow an authorized owner to update the requested key', async () => {
    const instructions = await generateInstructions({ hasOwner: true })

    expect(instructions).toMatchObject({ data: { pathname: 'reference.png' } })
    expect(mocks.generateClientToken).toHaveBeenCalledWith(
      expect.objectContaining({ allowOverwrite: true, pathname: 'reference.png' }),
    )
  })
})
