import { copy, head } from '@vercel/blob'
import { expect, it, vi } from 'vitest'

import { copyVercelBlobFile } from './copyFile.js'

vi.mock('@vercel/blob', () => ({
  BlobNotFoundError: class BlobNotFoundError extends Error {},
  copy: vi.fn(),
  del: vi.fn(),
  get: vi.fn(),
  head: vi.fn(),
  put: vi.fn(),
}))

it('should preserve content metadata, reject overwrite, and verify the destination', async () => {
  vi.mocked(head)
    .mockResolvedValueOnce({
      cacheControl: 'public, max-age=3600',
      contentType: 'image/png',
      size: 5,
    } as never)
    .mockRejectedValueOnce(Object.assign(new Error('missing'), { name: 'BlobNotFoundError' }))
    .mockResolvedValueOnce({ size: 5 } as never)
  vi.mocked(copy).mockResolvedValueOnce({ pathname: 'archive.png' } as never)

  await copyVercelBlobFile({
    access: 'public',
    cacheControlMaxAge: 60,
    from: 'source.png',
    to: 'archive.png',
    token: 'token',
  })

  expect(copy).toHaveBeenCalledWith('source.png', 'archive.png', {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: false,
    cacheControlMaxAge: 3600,
    contentType: 'image/png',
    token: 'token',
  })
  expect(head).toHaveBeenCalledTimes(3)
})
