import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Writable } from 'node:stream'

import { expect, it } from 'vitest'

import { createGcsAdapter } from './adapter.js'

it('should upload processed client bytes from the temporary file', async () => {
  const bytes = Buffer.from('processed image contents')
  const directory = await mkdtemp(path.join(tmpdir(), 'gcs-client-upload-'))
  const tempFilePath = path.join(directory, 'processed.png')
  let storedBytes: Buffer | undefined
  const client = {
    bucket: () => ({
      file: () => ({
        createWriteStream: () => {
          const chunks: Buffer[] = []

          return new Writable({
            final(callback) {
              storedBytes = Buffer.concat(chunks)
              callback()
            },
            write(chunk, _encoding, callback) {
              chunks.push(chunk as Buffer)
              callback()
            },
          })
        },
        save: async (body: Buffer) => {
          storedBytes = body
        },
      }),
    }),
  }
  const adapter = createGcsAdapter({
    bucket: 'media',
    clientUploads: true,
    getStorageClient: () => client as never,
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
