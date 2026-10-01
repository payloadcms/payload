import type { PayloadRequest } from 'payload'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  generateClientToken: vi.fn(async () => 'client-token'),
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
