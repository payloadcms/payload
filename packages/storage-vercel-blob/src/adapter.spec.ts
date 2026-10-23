import { put } from '@vercel/blob'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@vercel/blob', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@vercel/blob')>()),
  put: vi.fn(async (pathname: string) => ({ pathname: pathname.replace('.png', '-suffix.png') })),
}))

vi.mock('fs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('fs')>()),
  openAsBlob: vi.fn(async () => new Blob(['file'])),
}))

import { createVercelBlobAdapter } from './adapter.js'

const adapter = createVercelBlobAdapter({
  access: 'public',
  addRandomSuffix: true,
  baseUrl: 'https://example.com',
  cacheControlMaxAge: 60,
  token: 'token',
})({ collection: { fields: [], slug: 'media', upload: {} }, prefix: '' })

describe('handleUpload with addRandomSuffix', () => {
  it.each([
    ['main file', 'image.png', { filename: 'image-suffix.png', square: 'image-400x400.png' }],
    [
      'image size',
      'image-400x400.png',
      { filename: 'image.png', square: 'image-400x400-suffix.png' },
    ],
  ])('should set the suffixed filename only on the %s', async (_, filename, expected) => {
    const data = { filename: 'image.png', sizes: { square: { filename: 'image-400x400.png' } } }

    await adapter.handleUpload({
      data,
      file: {
        buffer: Buffer.from('file'),
        filename,
        filesize: 4,
        imageSizeName: filename === 'image.png' ? undefined : 'square',
        mimeType: 'image/png',
      },
      req: { context: {} },
      storageFilePath: filename,
    } as never)

    expect({ filename: data.filename, square: data.sizes.square.filename }).toEqual(expected)
  })

  it('should give image sizes with the same dimensions their own suffixed filenames', async () => {
    vi.mocked(put)
      .mockResolvedValueOnce({ pathname: 'image-400x400-a.png' } as never)
      .mockResolvedValueOnce({ pathname: 'image-400x400-b.png' } as never)

    const data = {
      filename: 'image.png',
      sizes: { card: { filename: 'image-400x400.png' }, square: { filename: 'image-400x400.png' } },
    }
    const uploadImageSize = (imageSizeName: string) =>
      adapter.handleUpload({
        data,
        file: {
          buffer: Buffer.from('file'),
          filename: 'image-400x400.png',
          filesize: 4,
          imageSizeName,
          mimeType: 'image/png',
        },
        req: { context: {} },
        storageFilePath: 'image-400x400.png',
      } as never)

    await Promise.all([uploadImageSize('card'), uploadImageSize('square')])

    expect(data.sizes).toEqual({
      card: { filename: 'image-400x400-a.png' },
      square: { filename: 'image-400x400-b.png' },
    })
  })

  it.each([
    ['a processed client upload', '/tmp/client-upload', false],
    ['another temp file', '/tmp/other-upload', true],
  ])('should set addRandomSuffix for %s', async (_, tempFilePath, expected) => {
    await adapter.handleUpload({
      data: { filename: 'image.png' },
      file: {
        buffer: Buffer.alloc(0),
        filename: 'image.png',
        filesize: 4,
        mimeType: 'image/png',
        tempFilePath,
      },
      req: { context: { payloadClientUploadTempFilePath: '/tmp/client-upload' } },
      storageFilePath: 'issued/image.png',
    } as never)

    expect(vi.mocked(put)).toHaveBeenLastCalledWith(
      'issued/image.png',
      expect.anything(),
      expect.objectContaining({ addRandomSuffix: expected }),
    )
  })
})
