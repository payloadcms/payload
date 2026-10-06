import { Readable } from 'node:stream'
import { expect, it, vi } from 'vitest'

import { copyAzureFile } from './copyFile.js'

it.each(['read', 'length', 'cleanup'])(
  'should remove its Azure copy after a %s failure',
  async (failure) => {
    const objects = new Map([['source', 'original bytes']])
    const copyError = new Error('verification failed')
    const cleanupError = new Error('deletion denied')
    const error = vi.fn()
    const source = {
      download: vi.fn().mockResolvedValue({ readableStreamBody: Readable.from('original bytes') }),
      getProperties: vi.fn().mockResolvedValue({ contentLength: 14 }),
      getTags: vi.fn().mockResolvedValue({ tags: {} }),
    }
    const destination = {
      deleteIfExists: vi.fn(({ conditions }) => {
        expect(conditions).toEqual({ ifMatch: 'copy-etag' })
        if (failure === 'cleanup') {
          return Promise.reject(cleanupError)
        }
        objects.delete('destination')
        return Promise.resolve({ succeeded: true })
      }),
      getProperties: vi.fn(() =>
        failure === 'read' || failure === 'cleanup'
          ? Promise.reject(copyError)
          : Promise.resolve({ contentLength: 1 }),
      ),
      uploadStream: vi.fn(() => {
        objects.set('destination', 'bad copy')
        return Promise.resolve({ etag: 'copy-etag' })
      }),
    }
    const client = {
      containerName: 'media',
      getBlockBlobClient: (key) => (key === 'source' ? source : destination),
    }

    await expect(
      copyAzureFile({
        client: client as never,
        from: 'source',
        req: { payload: { logger: { error } } } as never,
        to: 'destination',
      }),
    ).rejects.toThrow(failure === 'length' ? 'expected length' : copyError)
    expect(objects.has('destination')).toBe(failure === 'cleanup')
    if (failure === 'cleanup') {
      expect(error).toHaveBeenCalledWith({
        err: cleanupError,
        msg: expect.stringContaining('media/destination'),
      })
    }
    expect(objects.get('source')).toBe('original bytes')
  },
)

it('should preserve an Azure destination when create-only upload rejects a collision', async () => {
  const destination = {
    deleteIfExists: vi.fn(),
    uploadStream: vi.fn().mockRejectedValue(new Error('destination exists')),
  }
  const source = {
    download: vi.fn().mockResolvedValue({ readableStreamBody: Readable.from('source') }),
    getProperties: vi.fn().mockResolvedValue({ contentLength: 6 }),
    getTags: vi.fn().mockResolvedValue({ tags: {} }),
  }
  const client = { getBlockBlobClient: (key) => (key === 'source' ? source : destination) }

  await expect(
    copyAzureFile({ client: client as never, from: 'source', to: 'destination' }),
  ).rejects.toThrow('destination exists')
  expect(destination.uploadStream).toHaveBeenCalledWith(
    expect.anything(),
    expect.any(Number),
    expect.any(Number),
    expect.objectContaining({ conditions: { ifNoneMatch: '*' } }),
  )
  expect(destination.deleteIfExists).not.toHaveBeenCalled()
})
