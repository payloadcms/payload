import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { expect, it } from 'vitest'

import { createR2Adapter } from './adapter.js'

it('should upload processed client bytes from the temporary file', async () => {
  const bytes = Buffer.from('processed image contents')
  const directory = await mkdtemp(path.join(tmpdir(), 'r2-client-upload-'))
  const tempFilePath = path.join(directory, 'processed.png')
  let storedBytes: Buffer | undefined
  const bucket = {
    put: async (_key: string, body: Blob | Buffer) => {
      storedBytes = Buffer.isBuffer(body) ? body : Buffer.from(await body.arrayBuffer())
    },
  }
  const adapter = createR2Adapter({
    bucket: bucket as never,
    clientUploads: true,
  })({ collection: { slug: 'media' } } as never)

  try {
    await writeFile(tempFilePath, bytes)
    await adapter.handleUpload({
      data: { filename: 'processed.png' },
      file: {
        buffer: Buffer.alloc(0),
        filename: 'processed.png',
        filesize: bytes.length,
        mimeType: 'image/png',
        tempFilePath,
      },
      storageFilePath: 'upload-key/processed.png',
    } as never)

    expect(storedBytes).toEqual(bytes)
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})
