import { randomUUID } from 'crypto'
import { rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { expect, it } from 'vitest'

import { createR2Adapter } from './adapter.js'

it('should upload the temporary file contents', async () => {
  const bytes = Buffer.from('processed image contents')
  const tempFilePath = path.join(tmpdir(), `r2-upload-${randomUUID()}`)
  let storedBody: Blob | Buffer | undefined
  const bucket = {
    put: (_key: string, body: Blob | Buffer) => {
      storedBody = body
    },
  }
  const adapter = createR2Adapter({ bucket: bucket as never })({
    collection: { slug: 'media' },
  } as never)

  await writeFile(tempFilePath, bytes)

  try {
    await adapter.handleUpload({
      file: { buffer: Buffer.alloc(0), mimeType: 'image/png', tempFilePath },
      storageFilePath: 'processed.png',
    } as never)

    expect(Buffer.from(await new Response(storedBody).arrayBuffer())).toEqual(bytes)
  } finally {
    await rm(tempFilePath, { force: true })
  }
})
