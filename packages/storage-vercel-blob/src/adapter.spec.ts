import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ uploadFile: vi.fn(async () => ({})) }))

vi.mock('./uploadFile.js', () => ({ uploadFile: mocks.uploadFile }))

import { createVercelBlobAdapter } from './adapter.js'

describe('createVercelBlobAdapter', () => {
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
          file: { buffer: Buffer.from('image'), filename, mimeType: 'image/png' },
          req: {
            context: isClientUpload
              ? { payloadClientUploadTempFilePath: '/tmp/client-upload' }
              : {},
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
})
