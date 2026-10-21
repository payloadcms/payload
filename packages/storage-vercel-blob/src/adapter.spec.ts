import { describe, expect, it, vi } from 'vitest'

vi.mock('@vercel/blob', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@vercel/blob')>()),
  put: vi.fn(async (pathname: string) => ({ pathname: pathname.replace('.png', '-suffix.png') })),
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
      file: { buffer: Buffer.from('file'), filename, filesize: 4, mimeType: 'image/png' },
      storageFilePath: filename,
    } as never)

    expect({ filename: data.filename, square: data.sizes.square.filename }).toEqual(expected)
  })
})
