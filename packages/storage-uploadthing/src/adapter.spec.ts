import { randomUUID } from 'crypto'
import { rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { expect, it } from 'vitest'

import { createUploadthingAdapter } from './adapter.js'

it('should upload the temporary file contents', async () => {
  const bytes = Buffer.from('processed image contents')
  const tempFilePath = path.join(tmpdir(), `uploadthing-upload-${randomUUID()}`)
  let storedFile: File | undefined
  const utApi = {
    uploadFiles: (file: File) => {
      storedFile = file
      return { data: { name: file.name, key: 'stored-key' } }
    },
  }
  const adapter = createUploadthingAdapter({ acl: 'public-read', utApi: utApi as never })({
    collection: { slug: 'media' },
  } as never)

  await writeFile(tempFilePath, bytes)

  try {
    await adapter.handleUpload({
      data: {},
      file: {
        buffer: Buffer.alloc(0),
        filename: 'processed.png',
        mimeType: 'image/png',
        tempFilePath,
      },
      storageFilePath: 'processed.png',
    } as never)

    expect(Buffer.from(await storedFile!.arrayBuffer())).toEqual(bytes)
  } finally {
    await rm(tempFilePath, { force: true })
  }
})
