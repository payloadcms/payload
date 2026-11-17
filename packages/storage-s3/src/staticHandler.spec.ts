import { Readable } from 'node:stream'
import { uploadContentSecurityPolicy } from 'payload/internal'
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

describe('static handler response types', () => {
  it.each([
    { mimeType: 'text/xsl', requestHeaders: {}, status: 200 },
    { mimeType: 'TEXT/XSL; charset=utf-8', requestHeaders: { range: 'bytes=0-3' }, status: 206 },
    { mimeType: 'text/xsl', requestHeaders: { 'if-none-match': 'reference' }, status: 304 },
    { mimeType: 'text/plain', requestHeaders: {}, status: 200 },
  ])(
    'should serve $mimeType with the expected policy and status $status',
    async ({ mimeType, requestHeaders, status }) => {
      const content = '<document />'
      const getObject = vi.fn(async () => ({
        Body: Readable.from([status === 206 ? content.slice(0, 4) : content]),
      }))
      const adapter = createS3Adapter({
        bucket: 'bucket',
        config: {},
        getStorageClient: () =>
          ({
            getObject,
            headObject: vi.fn(async () => ({
              ContentLength: content.length,
              ContentType: mimeType,
              ETag: 'reference',
            })),
          }) as never,
        signedDownloads: false,
      })({ collection: { fields: [], slug: 'media', upload: {} } })
      const response = await adapter.staticHandler(
        {
          headers: new Headers(requestHeaders as Record<string, string>),
          payload: { logger: { error: vi.fn() } },
        } as never,
        { doc: { id: 'reference' }, params: { collection: 'media', filename: 'reference.xsl' } },
      )

      expect(response.status).toBe(status)
      expect(response.headers.get('Content-Type')).toBe(mimeType)
      expect(response.headers.get('Content-Security-Policy')).toBe(
        mimeType === 'text/plain' ? null : uploadContentSecurityPolicy,
      )
      expect(await response.text()).toBe(
        status === 304 ? '' : status === 206 ? content.slice(0, 4) : content,
      )
      if (status === 304) {
        expect(getObject).not.toHaveBeenCalled()
      } else {
        expect(getObject).toHaveBeenCalledWith(
          {
            Bucket: 'bucket',
            Key: 'reference.xsl',
            Range: status === 206 ? 'bytes=0-3' : undefined,
          },
          expect.any(Object),
        )
      }
    },
  )
})
