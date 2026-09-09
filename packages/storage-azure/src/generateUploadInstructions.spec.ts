import type { ContainerClient } from '@azure/storage-blob'
import type { PayloadRequest } from 'payload'

import { StorageSharedKeyCredential } from '@azure/storage-blob'
import { describe, expect, it, vi } from 'vitest'

import { generateUploadInstructions } from './generateUploadInstructions.js'

const createRequest = (allowRestrictedFileTypes: boolean): PayloadRequest =>
  ({
    payload: {
      collections: {
        media: {
          config: {
            slug: 'media',
            upload: { allowRestrictedFileTypes },
          },
        },
      },
      config: { upload: {} },
      db: { findOne: () => Promise.resolve(null) },
    },
    user: { id: 'user-id' },
  }) as unknown as PayloadRequest

const createGenerator = (getStorageClient: () => ContainerClient) =>
  generateUploadInstructions({
    collectionPrefix: '',
    containerName: 'media',
    getStorageClient,
  })

describe('generateUploadInstructions', () => {
  it('should use Payload uploads under secure defaults', async () => {
    const getStorageClient = vi.fn()

    await expect(
      createGenerator(getStorageClient)({
        collectionSlug: 'media',
        filename: 'reference.png',
        filesize: 1,
        mimeType: 'image/png',
        overrideAccess: false,
        req: createRequest(false),
      }),
    ).rejects.toThrow('Azure client uploads require allowRestrictedFileTypes to be enabled.')

    expect(getStorageClient).not.toHaveBeenCalled()
  })

  it('should generate direct instructions for the explicit opt-out', async () => {
    const credential = new StorageSharedKeyCredential(
      'account',
      Buffer.alloc(32, 'a').toString('base64'),
    )
    const getStorageClient = () =>
      ({
        credential,
        getBlobClient: (key: string) => ({
          url: `https://account.blob.core.windows.net/media/${key}`,
        }),
      }) as unknown as ContainerClient

    await expect(
      createGenerator(getStorageClient)({
        collectionSlug: 'media',
        filename: 'reference.png',
        filesize: 1,
        mimeType: 'image/png',
        overrideAccess: false,
        req: createRequest(true),
      }),
    ).resolves.toMatchObject({
      file: { filename: 'reference.png', mimeType: 'image/png', size: 1 },
      name: 'uploadToAzure',
      type: 'dispatch',
    })
  })
})
