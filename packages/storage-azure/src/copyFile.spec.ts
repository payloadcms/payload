import { Readable } from 'node:stream'

import { expect, it, vi } from 'vitest'

import { copyAzureFile } from './copyFile.js'

it('should copy a private source without overwrite and preserve its headers and tags', async () => {
  const uploadStream = vi.fn().mockResolvedValue({})
  const source = {
    download: vi
      .fn()
      .mockResolvedValue({ readableStreamBody: Readable.from(Buffer.from('bytes')) }),
    getProperties: vi.fn().mockResolvedValue({
      contentLength: 5,
      contentType: 'image/png',
      metadata: { owner: 'payload' },
    }),
    getTags: vi.fn().mockResolvedValue({ tags: { role: 'original' } }),
  }
  const destination = {
    getProperties: vi.fn().mockResolvedValue({ contentLength: 5 }),
    uploadStream,
  }
  const client = {
    getBlockBlobClient: vi.fn((key: string) => (key === 'source.png' ? source : destination)),
  } as never

  await copyAzureFile({ client, from: 'source.png', to: 'archive.png' })

  expect(uploadStream).toHaveBeenCalledWith(
    expect.anything(),
    expect.any(Number),
    expect.any(Number),
    expect.objectContaining({
      conditions: { ifNoneMatch: '*' },
      metadata: { owner: 'payload' },
      tags: { role: 'original' },
    }),
  )
  expect(destination.getProperties).toHaveBeenCalledOnce()
})
