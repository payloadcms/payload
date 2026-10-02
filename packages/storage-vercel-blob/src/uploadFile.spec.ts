import { createServer } from 'node:http'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { expect, it } from 'vitest'

import { uploadFile } from './uploadFile.js'

it('should send the complete temporary file again after a transient storage failure', async () => {
  const bytes = Buffer.from('processed image contents')
  const directory = await mkdtemp(path.join(tmpdir(), 'vercel-blob-retry-'))
  const tempFilePath = path.join(directory, 'processed.png')
  const attempts: Buffer[] = []
  const previousApiURL = process.env.VERCEL_BLOB_API_URL
  const previousRetries = process.env.VERCEL_BLOB_RETRIES
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = []

    for await (const chunk of req) {
      chunks.push(chunk as Buffer)
    }

    attempts.push(Buffer.concat(chunks))
    res.setHeader('content-type', 'application/json')
    if (attempts.length === 1) {
      res.writeHead(503)
      res.end(JSON.stringify({ error: { code: 'service_unavailable' } }))
      return
    }

    res.writeHead(200)
    res.end(JSON.stringify({ pathname: 'processed.png', url: 'https://example.com/processed.png' }))
  })

  try {
    await writeFile(tempFilePath, bytes)
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()

    if (!address || typeof address === 'string') {
      throw new Error('Expected a local HTTP server address')
    }

    process.env.VERCEL_BLOB_API_URL = `http://127.0.0.1:${address.port}/api/blob`
    process.env.VERCEL_BLOB_RETRIES = '1'

    await uploadFile({
      access: 'public',
      buffer: Buffer.alloc(0),
      mimeType: 'image/png',
      storageFilePath: 'processed.png',
      tempFilePath,
      token: 'vercel_blob_rw_emulator_test',
    })

    expect(attempts).toEqual([bytes, bytes])
  } finally {
    if (previousApiURL === undefined) {
      delete process.env.VERCEL_BLOB_API_URL
    } else {
      process.env.VERCEL_BLOB_API_URL = previousApiURL
    }
    if (previousRetries === undefined) {
      delete process.env.VERCEL_BLOB_RETRIES
    } else {
      process.env.VERCEL_BLOB_RETRIES = previousRetries
    }
    await new Promise<void>((resolve) => server.close(() => resolve()))
    await rm(directory, { force: true, recursive: true })
  }
})
