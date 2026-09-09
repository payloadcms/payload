import type { ContainerClient } from '@azure/storage-blob'
import type { PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

const azureMocks = vi.hoisted(() => ({
  generateBlobSASQueryParameters: vi.fn(() => ({ toString: () => 'signature' })),
  parsePermissions: vi.fn(() => ({ create: true })),
}))

vi.mock('@azure/storage-blob', () => ({
  BlobSASPermissions: { parse: azureMocks.parsePermissions },
  generateBlobSASQueryParameters: azureMocks.generateBlobSASQueryParameters,
}))

vi.mock('@payloadcms/plugin-cloud-storage/utilities', () => ({
  resolveSignedURLKey: vi.fn(async () => ({
    fileKey: 'reference.png',
    sanitizedDocPrefix: '',
    sanitizedFilename: 'reference.png',
  })),
}))

import { generateUploadInstructions } from './generateUploadInstructions.js'

describe('generateUploadInstructions', () => {
  it('should issue create-only Azure upload instructions', async () => {
    const generate = generateUploadInstructions({
      collectionPrefix: '',
      containerName: 'media',
      getStorageClient: () =>
        ({
          credential: {},
          getBlobClient: () => ({ url: 'https://example.com/reference.png' }),
        }) as unknown as ContainerClient,
    })

    await generate({
      collectionSlug: 'media',
      filename: 'reference.png',
      filesize: 100,
      mimeType: 'image/png',
      overrideAccess: true,
      req: {
        payload: {
          collections: {
            media: {
              config: {
                upload: { allowRestrictedFileTypes: true },
              },
            },
          },
        },
      } as unknown as PayloadRequest,
    })

    expect(azureMocks.parsePermissions).toHaveBeenCalledExactlyOnceWith('c')
    expect(azureMocks.generateBlobSASQueryParameters).toHaveBeenCalledWith(
      expect.objectContaining({ version: '2026-04-06' }),
      expect.anything(),
    )
  })
})
