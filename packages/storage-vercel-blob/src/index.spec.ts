import type { Config } from 'payload'

import { describe, expect, it } from 'vitest'

import { vercelBlobStorage as serverEntry } from './exports/server.js'
import { vercelBlobStorage as rootEntry } from './index.js'

const options = {
  clientUploads: {},
  collections: { media: true },
  token: 'vercel_blob_rw_store123_secret',
}

const freshConfig = (): Config => ({ collections: [{ fields: [], slug: 'media' }] }) as Config

describe('storage-vercel-blob entrypoints', () => {
  it('root entry registers the client upload route', () => {
    const config = rootEntry(options)(freshConfig())

    expect(
      config.endpoints?.some((endpoint) => endpoint.path === '/vercel-blob-client-upload-route'),
    ).toBe(true)
  })

  it('server entry does not register the client upload route', () => {
    const config = serverEntry(options)(freshConfig())

    expect(
      config.endpoints?.some((endpoint) =>
        endpoint.path?.startsWith('/vercel-blob-client-upload-route'),
      ) ?? false,
    ).toBe(false)
  })
})
