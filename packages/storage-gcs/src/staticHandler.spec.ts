import { Readable } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'

import { createGcsAdapter } from './adapter.js'

describe('static handler document locations', () => {
  it('should read the checked document without another lookup', async () => {
    const file = vi.fn(() => ({
      createReadStream: () => Readable.from([Buffer.from('file')]),
      getMetadata: vi.fn(async () => [{ contentType: 'image/png', size: 4 }]),
    }))
    const adapter = createGcsAdapter({
      bucket: 'bucket',
      getStorageClient: () => ({ bucket: () => ({ file }) }) as never,
    })
    const find = vi.fn(async () => ({ docs: [{ prefix: 'database' }] }))
    const generatedAdapter = adapter({
      collection: {
        fields: [],
        slug: 'media',
        upload: {},
      },
      prefix: 'media',
    })
    const doc = {
      id: 'authorized',
      prefix: 'legacy',
    }
    const response = await generatedAdapter.staticHandler(
      {
        headers: new Headers(),
        payload: { find, logger: { error: vi.fn() } },
      } as never,
      {
        doc,
        params: { collection: 'media', filename: 'original.png' },
      },
    )

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('file')
    expect(file).toHaveBeenCalledWith('legacy/original.png')
    expect(find).not.toHaveBeenCalled()
  })

  const createHandler = (createReadStream: () => unknown) => {
    const file = vi.fn(() => ({
      createReadStream,
      getMetadata: vi.fn(async () => [{ contentType: 'image/png', size: 4 }]),
    }))
    const adapter = createGcsAdapter({
      bucket: 'bucket',
      getStorageClient: () => ({ bucket: () => ({ file }) }) as never,
    })
    const generatedAdapter = adapter({
      collection: {
        fields: [],
        slug: 'media',
        upload: {},
      },
      prefix: 'media',
    })

    const doc = { id: 'authorized', prefix: 'legacy' }

    return () =>
      generatedAdapter.staticHandler(
        {
          headers: new Headers(),
          payload: { find: vi.fn(), logger: { error: vi.fn() } },
        } as never,
        {
          doc,
          params: { collection: 'media', filename: 'original.png' },
        },
      )
  }

  it('destroys the node stream when the response body is cancelled', async () => {
    const destroy = vi.fn()
    const getHandler = createHandler(() => ({ destroy, on: vi.fn() }))

    const response = await getHandler()
    await response.body!.cancel()

    expect(destroy).toHaveBeenCalled()
  })

  it('ignores node stream data after the response body is cancelled', async () => {
    const listeners: Record<string, (chunk: Buffer) => void> = {}
    const on = vi.fn((event: string, listener: (chunk: Buffer) => void) => {
      listeners[event] = listener
    })
    const getHandler = createHandler(() => ({ destroy: vi.fn(), on }))

    const response = await getHandler()
    await response.body!.cancel()

    expect(() => listeners.data!(Buffer.from('late'))).not.toThrow()
  })
})
