import { describe, expect, it } from 'vitest'

import { getSanitizeUploadPrefixHook } from './sanitizeUploadPrefix.js'

const makeReq = (file?: Record<string, unknown>) => ({ context: {}, file }) as any

describe('sanitizeUploadPrefix', () => {
  it('should preserve metadata during the plugin internal update', () => {
    const result = getSanitizeUploadPrefixHook()({
      data: {
        customStorageID: 'storage-id',
        prefix: '/adapter/../prefix',
        sizes: { adapterSize: { filename: 'adapter-size.png' } },
      },
      operation: 'update',
      req: {
        context: {
          skipCloudStorage: true,
        },
        file: { name: 'photo.png' },
      },
    } as any)

    expect(result).toEqual({
      customStorageID: 'storage-id',
      prefix: '/adapter/../prefix',
      sizes: { adapterSize: { filename: 'adapter-size.png' } },
    })
  })

  it('should use the sanitized display prefix for server-mediated file uploads', () => {
    const result = getSanitizeUploadPrefixHook()({
      data: { filename: 'photo.png', prefix: '/tenant/../acme' },
      operation: 'create',
      req: makeReq({ mimetype: 'image/png', name: 'photo.png', size: 42 }),
    } as any)

    expect(result.prefix).toBe('tenant/acme')
  })

  it('should leave metadata unchanged when no file is written', () => {
    const result = getSanitizeUploadPrefixHook()({
      data: {
        filename: 'submitted.png',
        prefix: 'submitted-prefix',
        sizes: { thumbnail: { filename: 'submitted-thumbnail.png' } },
      },
      operation: 'update',
      originalDoc: {
        filename: 'existing.png',
        prefix: 'existing-prefix',
        sizes: { thumbnail: { filename: 'existing-thumbnail.png' } },
      },
      req: makeReq(),
    } as any)

    expect(result).toEqual({
      filename: 'submitted.png',
      prefix: 'submitted-prefix',
      sizes: { thumbnail: { filename: 'submitted-thumbnail.png' } },
    })
  })
})
