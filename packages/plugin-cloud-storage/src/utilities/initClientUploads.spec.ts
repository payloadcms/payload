import type { Config, PayloadHandler } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { initClientUploads } from './initClientUploads.js'

describe('initClientUploads', () => {
  it('does not add Admin providers when client uploads are disabled', () => {
    const clientHandler = '@payloadcms/storage-s3/client#S3ClientUploadHandler'
    const collections = Object.fromEntries(
      Array.from({ length: 50 }, (_, index) => [`upload-${index}`, true] as const),
    )
    const config = {} as Config

    initClientUploads({
      clientHandler,
      collections,
      config,
      enabled: false,
      serverHandler: vi.fn() as PayloadHandler,
      serverHandlerPath: '/storage-s3-generate-signed-url',
    })

    expect(config.admin?.dependencies).toEqual({
      [clientHandler]: {
        path: clientHandler,
        type: 'function',
      },
    })
    expect(config.admin?.components?.providers).toBeUndefined()
  })
})
