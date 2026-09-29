import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ uploadFile: vi.fn(async () => ({})) }))

vi.mock('./uploadFile.js', () => ({ uploadFile: mocks.uploadFile }))

import { createVercelBlobAdapter } from './adapter.js'

describe('createVercelBlobAdapter', () => {
  it.each([true, { access: () => true }, false])(
    'should keep the suffix policy consistent for clientUploads=%j',
    async (clientUploads) => {
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
          file: { buffer: Buffer.from('image'), filename, mimeType: 'image/png' },
          storageFilePath: `upload-key/${filename}`,
        } as never)

        expect(mocks.uploadFile).toHaveBeenLastCalledWith(
          expect.objectContaining({
            addRandomSuffix: !clientUploads,
            storageFilePath: `upload-key/${filename}`,
          }),
        )
      }
    },
  )
})
