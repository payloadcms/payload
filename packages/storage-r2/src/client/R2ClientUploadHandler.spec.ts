import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Config } from 'payload'

vi.mock('@payloadcms/plugin-cloud-storage/client', async () => {
  const { buildUploadStoragePathData } = await import('@payloadcms/plugin-cloud-storage/utilities')

  return {
    createClientUploadHandler: ({ handler }: { handler: unknown }) => handler,
    buildUploadStoragePathData,
  }
})

import type { R2Bucket, R2StorageClientUploadContext } from '../types.js'

import { r2Storage } from '../index.js'
import { R2ClientUploadHandler } from './R2ClientUploadHandler.js'

const invoke = R2ClientUploadHandler as unknown as (args: {
  apiRoute: string
  collectionSlug: string
  docPrefix?: string
  extra: { chunkSize?: number; useCompositePrefixes?: boolean }
  file: File
  prefix?: string
  serverHandlerPath: `/${string}`
  serverURL: string
  updateFilename: (value: string) => void
}) => Promise<R2StorageClientUploadContext | undefined>

describe('R2ClientUploadHandler', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should receive the configured composite prefix mode', () => {
    const config = r2Storage({
      bucket: {} as R2Bucket,
      clientUploads: true,
      collections: { media: { prefix: 'collection' } },
      useCompositePrefixes: true,
    })({
      collections: [{ fields: [], slug: 'media', upload: true }],
    } as unknown as Config) as Config
    const provider = config.admin?.components?.providers?.[0] as
      | { clientProps?: { extra?: { useCompositePrefixes?: boolean } } }
      | undefined

    expect(provider?.clientProps?.extra).toEqual({ useCompositePrefixes: true })
  })

  it('should preserve the document prefix for composite uploads', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          clientUploadContext: { prefix: 'collection/document', signedReceipt: 'receipt' },
          key: 'collection/document/file.txt',
          uploadId: 'upload-id',
        }),
      )
      .mockResolvedValueOnce(Response.json({ etag: 'etag', partNumber: 1 }))
      .mockResolvedValueOnce(new Response('collection/document/file.txt'))
    vi.stubGlobal('fetch', fetchMock)

    await invoke({
      apiRoute: '/api',
      collectionSlug: 'media',
      docPrefix: 'document',
      extra: { chunkSize: 10, useCompositePrefixes: true },
      file: new File(['content'], 'file.txt', { type: 'text/plain' }),
      prefix: 'collection',
      serverHandlerPath: '/storage-r2-multi-part-upload',
      serverURL: 'https://example.com',
      updateFilename: vi.fn(),
    })

    const requestURL = new URL(fetchMock.mock.calls[0]![0])
    expect(requestURL.searchParams.get('docPrefix')).toBe('document')
  })
})
