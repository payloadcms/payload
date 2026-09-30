import { Readable } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'

import { createS3Adapter } from './adapter.js'

describe('static handler document locations', () => {
  it('should read the checked document without another lookup', async () => {
    const headObject = vi.fn(async () => ({ ContentLength: 4, ContentType: 'image/png' }))
    const getObject = vi.fn(async () => ({ Body: Readable.from(['file']) }))
    const adapter = createS3Adapter({
      bucket: 'bucket',
      config: {},
      getStorageClient: () => ({ getObject, headObject }) as never,
      signedDownloads: false,
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
    expect(headObject).toHaveBeenCalledWith({ Bucket: 'bucket', Key: 'legacy/original.png' })
    expect(getObject).toHaveBeenCalledWith(
      expect.objectContaining({ Bucket: 'bucket', Key: 'legacy/original.png' }),
      expect.any(Object),
    )
    expect(find).not.toHaveBeenCalled()
  })
})
