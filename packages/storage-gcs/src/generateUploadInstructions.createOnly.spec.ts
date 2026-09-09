import type { Storage } from '@google-cloud/storage'
import type { PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

vi.mock('@payloadcms/plugin-cloud-storage/utilities', () => ({
  resolveSignedURLKey: vi.fn(async () => ({
    fileKey: 'reference.png',
    sanitizedDocPrefix: '',
    sanitizedFilename: 'reference.png',
  })),
}))

import { generateUploadInstructions } from './generateUploadInstructions.js'

describe('generateUploadInstructions', () => {
  it('should issue create-only GCS upload instructions', async () => {
    const getSignedUrl = vi.fn(async () => ['https://example.com/reference.png'])
    const generate = generateUploadInstructions({
      bucket: 'media',
      collectionPrefix: '',
      getStorageClient: () =>
        ({
          bucket: () => ({ file: () => ({ getSignedUrl }) }),
        }) as unknown as Storage,
    })

    const instructions = await generate({
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
                upload: true,
              },
            },
          },
        },
      } as unknown as PayloadRequest,
    })

    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        extensionHeaders: { 'x-goog-if-generation-match': '0' },
      }),
    )
    expect(instructions).toMatchObject({
      request: {
        headers: { 'x-goog-if-generation-match': '0' },
      },
    })
  })
})
