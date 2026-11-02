import { describe, expect, it, vi } from 'vitest'

import { createR2Adapter } from './adapter.js'

describe('static handler document locations', () => {
  it('should read the checked document without another lookup', async () => {
    const head = vi.fn(async () => ({ size: 4 }))
    const get = vi.fn(async () => ({ body: 'file', writeHttpMetadata: vi.fn() }))
    const adapter = createR2Adapter({
      bucket: { get, head } as never,
      collections: { media: true },
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
    expect(head).toHaveBeenCalledWith('legacy/original.png')
    expect(get).toHaveBeenCalledWith('legacy/original.png')
    expect(find).not.toHaveBeenCalled()
  })
})
