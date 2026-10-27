import { randomUUID } from 'crypto'
import { rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { Writable } from 'stream'
import { expect, it } from 'vitest'

import { createGcsAdapter } from './adapter.js'

it('should upload the temporary file contents', async () => {
  const bytes = Buffer.from('processed image contents')
  const tempFilePath = path.join(tmpdir(), `gcs-upload-${randomUUID()}`)
  const chunks: Buffer[] = []
  const client = {
    bucket: () => ({
      file: () => ({
        createWriteStream: () =>
          new Writable({
            write(chunk, _encoding, callback) {
              chunks.push(chunk)
              callback()
            },
          }),
      }),
    }),
  }
  const adapter = createGcsAdapter({ bucket: 'media', getStorageClient: () => client as never })({
    collection: { slug: 'media' },
  } as never)

  await writeFile(tempFilePath, bytes)

  try {
    await adapter.handleUpload({
      file: { buffer: Buffer.alloc(0), mimeType: 'image/png', tempFilePath },
      storageFilePath: 'processed.png',
    } as never)

    expect(Buffer.concat(chunks)).toEqual(bytes)
  } finally {
    await rm(tempFilePath, { force: true })
  }
})
