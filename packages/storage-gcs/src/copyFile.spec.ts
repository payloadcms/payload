import { expect, it, vi } from 'vitest'

import { copyGcsFile } from './copyFile.js'

it.each(['permissions', 'read', 'length', 'cleanup'])(
  'should remove only its GCS copy after a %s failure',
  async (failure) => {
    const objects = new Map([['source', { generation: '1', size: '10' }]])
    const copyError = new Error('copy verification failed')
    const cleanupError = new Error('deletion denied')
    const error = vi.fn()
    const destination = {
      delete: vi.fn(),
      exists: vi.fn().mockResolvedValue([false]),
      getMetadata: vi.fn(() =>
        failure === 'read' || failure === 'cleanup'
          ? Promise.reject(copyError)
          : Promise.resolve([{ size: '1' }]),
      ),
      makePublic: vi.fn(() =>
        failure === 'permissions' ? Promise.reject(copyError) : Promise.resolve([]),
      ),
    }
    const copiedGeneration = {
      delete: vi.fn(() => {
        if (failure === 'cleanup') {
          return Promise.reject(cleanupError)
        }
        objects.delete('destination')
        return Promise.resolve([])
      }),
    }
    const source = {
      copy: vi.fn(() => {
        objects.set('destination', { generation: '2', size: '1' })
        return Promise.resolve([destination, { resource: { generation: '2' } }])
      }),
      getMetadata: vi.fn().mockResolvedValue([objects.get('source')]),
    }
    const file = vi.fn((key, options) =>
      key === 'source' ? source : options?.generation === '2' ? copiedGeneration : destination,
    )
    const client = { bucket: () => ({ file }) }

    await expect(
      copyGcsFile({
        acl: 'Public',
        bucket: 'media',
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
    expect(objects.get('source')).toEqual({ generation: '1', size: '10' })
    expect(file).toHaveBeenCalledWith('destination', { generation: '2' })
    expect(destination.delete).not.toHaveBeenCalled()
  },
)

it('should preserve an occupied GCS destination', async () => {
  const destination = { delete: vi.fn(), exists: vi.fn().mockResolvedValue([true]) }
  const source = { copy: vi.fn(), getMetadata: vi.fn().mockResolvedValue([{ size: '10' }]) }
  const client = { bucket: () => ({ file: (key) => (key === 'source' ? source : destination) }) }

  await expect(
    copyGcsFile({ bucket: 'media', client: client as never, from: 'source', to: 'destination' }),
  ).rejects.toThrow('already exists')
  expect(source.copy).not.toHaveBeenCalled()
  expect(destination.delete).not.toHaveBeenCalled()
})
