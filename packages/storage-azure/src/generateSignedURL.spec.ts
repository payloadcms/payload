import type { ContainerClient } from '@azure/storage-blob'
import type { PayloadRequest } from 'payload'

import { StorageSharedKeyCredential } from '@azure/storage-blob'
import { describe, expect, it, vi } from 'vitest'

import { getGenerateSignedURLHandler } from './generateSignedURL.js'

const createRequest = (
  allowRestrictedFileTypes: boolean,
  mimeType: unknown,
  filename = 'reference.png',
): PayloadRequest =>
  ({
    json: () =>
      Promise.resolve({
        collectionSlug: 'media',
        filename,
        mimeType,
      }),
    payload: {
      collections: {
        media: {
          config: {
            slug: 'media',
            access: {},
            upload: { allowRestrictedFileTypes },
          },
        },
      },
      db: { findOne: () => Promise.resolve(null) },
    },
    user: { id: 'user-id' },
  }) as unknown as PayloadRequest

describe('Azure signed upload URLs', () => {
  it('should use Payload uploads under secure defaults', async () => {
    const getStorageClient = vi.fn()
    const handler = getGenerateSignedURLHandler({
      collections: { media: true },
      containerName: 'media',
      getStorageClient,
    })

    await expect(handler(createRequest(false, 'image/png'))).rejects.toThrow(
      'Azure client uploads require allowRestrictedFileTypes.',
    )
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
    const handler = getGenerateSignedURLHandler({
      collections: { media: true },
      containerName: 'media',
      getStorageClient,
    })

    const response = await handler(createRequest(true, 'image/png', 'folder\\nested/reference.png'))
    const result = (await response.json()) as { filename: string; url: string }

    expect(result.filename).toBe('reference.png')
    expect(result.url).toMatch(
      /https:\/\/account\.blob\.core\.windows\.net\/media\/[0-9a-f-]+\/reference\.png\?/,
    )
  })
})
