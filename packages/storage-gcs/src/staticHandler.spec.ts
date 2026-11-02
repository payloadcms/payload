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
})
