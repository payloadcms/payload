import { afterEach, expect, it, vi } from 'vitest'

import { copyVercelBlobFile } from './copyFile.js'

const sdk = vi.hoisted(() => ({ copy: vi.fn(), del: vi.fn(), head: vi.fn(), put: vi.fn() }))

vi.mock('@vercel/blob', () => ({ ...sdk, BlobNotFoundError: class extends Error {} }))

afterEach(() => {
  vi.resetAllMocks()
  vi.unstubAllGlobals()
})

it.each(['copy read', 'fallback read', 'fallback length', 'cleanup'])(
  'should remove its Vercel copy after a %s failure',
  async (failure) => {
    const objects = new Map([['source', { etag: 'source', size: 10 }]])
    const copyError = new Error('verification failed')
    const cleanupError = new Error('deletion denied')
    const error = vi.fn()
    sdk.head.mockImplementation((key) => {
      if (!objects.has(key)) {
        return Promise.reject(Object.assign(new Error('missing'), { name: 'BlobNotFoundError' }))
      }
      if (
        key === 'destination' &&
        (failure === 'copy read' ||
          failure === 'cleanup' ||
          (failure === 'fallback read' && objects.get(key)?.etag === 'fallback'))
      ) {
        return Promise.reject(copyError)
      }
      return Promise.resolve({
        ...objects.get(key),
        cacheControl: 'max-age=10',
        contentType: 'image/png',
        url: 'https://example.test/source',
      })
    })
    sdk.copy.mockImplementation(() => {
      objects.set('destination', { etag: 'copy', size: 1 })
      return Promise.resolve({ etag: 'copy', pathname: 'destination' })
    })
    sdk.put.mockImplementation(() => {
      objects.set('destination', { etag: 'fallback', size: 1 })
      return Promise.resolve({ etag: 'fallback', pathname: 'destination' })
    })
    sdk.del.mockImplementation((key, { ifMatch }) => {
      expect(objects.get(key)?.etag).toBe(ifMatch)
      if (failure === 'cleanup') {
        return Promise.reject(cleanupError)
      }
      objects.delete(key)
      return Promise.resolve()
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('original bytes')))

    await expect(
      copyVercelBlobFile({
        access: 'public',
        cacheControlMaxAge: 10,
        from: 'source',
        req: { payload: { logger: { error } } } as never,
        to: 'destination',
        token: 'token',
      }),
    ).rejects.toThrow(failure === 'fallback length' ? 'expected length' : copyError)
    expect(objects.has('destination')).toBe(failure === 'cleanup')
    if (failure === 'cleanup') {
      expect(error).toHaveBeenCalledWith({
        err: cleanupError,
        msg: expect.stringContaining('destination'),
      })
    }
    expect(objects.get('source')).toEqual({ etag: 'source', size: 10 })
    expect(sdk.del).toHaveBeenCalledTimes(failure === 'copy read' || failure === 'cleanup' ? 1 : 2)
  },
)

it('should preserve an occupied Vercel destination', async () => {
  sdk.head.mockResolvedValue({ size: 10 })

  await expect(
    copyVercelBlobFile({
      access: 'public',
      cacheControlMaxAge: 10,
      from: 'source',
      to: 'destination',
      token: 'token',
    }),
  ).rejects.toThrow('already exists')
  expect(sdk.copy).not.toHaveBeenCalled()
  expect(sdk.del).not.toHaveBeenCalled()
})

it('should not delete a destination claimed by another upload during the Vercel fallback', async () => {
  sdk.head
    .mockResolvedValueOnce({
      size: 10,
      cacheControl: '',
      contentType: 'image/png',
      url: 'https://example.test/source',
    })
    .mockRejectedValueOnce(Object.assign(new Error('missing'), { name: 'BlobNotFoundError' }))
    .mockResolvedValueOnce({ size: 1 })
  sdk.copy.mockResolvedValue({ etag: 'copy', pathname: 'destination' })
  sdk.del.mockResolvedValue(undefined)
  sdk.put.mockRejectedValue(new Error('destination exists'))
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('original bytes')))

  await expect(
    copyVercelBlobFile({
      access: 'public',
      cacheControlMaxAge: 10,
      from: 'source',
      to: 'destination',
      token: 'token',
    }),
  ).rejects.toThrow('destination exists')
  expect(sdk.del).toHaveBeenCalledExactlyOnceWith('destination', {
    ifMatch: 'copy',
    token: 'token',
  })
})

it('should remove the actual Vercel pathname when the provider returns an unexpected key', async () => {
  sdk.head
    .mockResolvedValueOnce({ size: 10, cacheControl: '', contentType: 'image/png' })
    .mockRejectedValueOnce(Object.assign(new Error('missing'), { name: 'BlobNotFoundError' }))
  sdk.copy.mockResolvedValue({ etag: 'copy', pathname: 'destination-unexpected' })
  sdk.del.mockResolvedValue(undefined)

  await expect(
    copyVercelBlobFile({
      access: 'public',
      cacheControlMaxAge: 10,
      from: 'source',
      to: 'destination',
      token: 'token',
    }),
  ).rejects.toThrow('unexpected destination key')
  expect(sdk.del).toHaveBeenCalledExactlyOnceWith('destination-unexpected', {
    ifMatch: 'copy',
    token: 'token',
  })
})
