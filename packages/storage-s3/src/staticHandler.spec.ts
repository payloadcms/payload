import { Readable } from 'node:stream'
import { UPLOAD_CONTENT_SECURITY_POLICY } from 'payload/internal'
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
    expect(response.headers.get('Content-Security-Policy')).toBeNull()
    expect(await response.text()).toBe('file')
    expect(headObject).toHaveBeenCalledWith({ Bucket: 'bucket', Key: 'legacy/original.png' })
    expect(getObject).toHaveBeenCalledWith(
      expect.objectContaining({ Bucket: 'bucket', Key: 'legacy/original.png' }),
      expect.any(Object),
    )
    expect(find).not.toHaveBeenCalled()
  })

  it.each([
    { mimeType: 'text/xsl', headers: new Headers(), status: 200, body: 'file', reads: 1 },
    {
      mimeType: 'TEXT/XSL; charset=utf-8',
      headers: new Headers({ range: 'bytes=0-3' }),
      status: 206,
      body: 'file',
      reads: 1,
    },
    {
      mimeType: 'text/xsl',
      headers: new Headers({ 'if-none-match': 'version' }),
      status: 304,
      body: '',
      reads: 0,
    },
  ])(
    'should apply XML response headers for $mimeType with status $status',
    async ({ mimeType, headers, status, body, reads }) => {
      const headObject = vi.fn(async () => ({
        ContentLength: 4,
        ContentType: mimeType,
        ETag: 'version',
      }))
      const getObject = vi.fn(async () => ({ Body: Readable.from(['file']) }))
      const adapter = createS3Adapter({
        bucket: 'bucket',
        config: {},
        getStorageClient: () => ({ getObject, headObject }) as never,
        signedDownloads: false,
      })({ collection: { fields: [], slug: 'media', upload: {} } })
      const response = await adapter.staticHandler(
        { headers, payload: { logger: { error: vi.fn() } } } as never,
        { doc: { id: 'document' }, params: { collection: 'media', filename: 'document.xsl' } },
      )

      expect(response.status).toBe(status)
      expect(response.headers.get('Content-Type')).toBe(mimeType)
      expect(response.headers.get('Content-Security-Policy')).toBe(UPLOAD_CONTENT_SECURITY_POLICY)
      expect(response.headers.get('ETag')).toBe('version')
      expect(await response.text()).toBe(body)
      expect(getObject).toHaveBeenCalledTimes(reads)
    },
  )
})
