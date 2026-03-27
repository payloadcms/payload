import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { Payload } from 'payload'

import { del, list } from '@vercel/blob'
import { upload } from '@vercel/blob/client'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { createServer } from 'node:http'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { prefix } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Load emulated env vars so @vercel/blob SDK uses the local emulator
dotenv.config({ path: path.resolve(dirname, '../plugin-cloud-storage/.env.emulated') })

let payload: Payload
let restClient: NextRESTClient
let httpServer: Server
let handleUploadUrl: string

const serverHandlerPath = '/vercel-blob-client-upload-route'

describe('@payloadcms/storage-vercel-blob clientUploads', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(
      dirname,
      undefined,
      undefined,
      path.resolve(dirname, 'clientUploads.config.ts'),
    ))

    // Start a real HTTP server to bridge upload()'s undici fetch calls to restClient.
    // @vercel/blob/client uses undici internally, so a real HTTP server is required.
    httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const chunks: Buffer[] = []
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      await new Promise<void>((resolve) => req.on('end', resolve))

      const body = Buffer.concat(chunks).toString()
      const headers: Record<string, string> = {}
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string') {
          headers[key] = value
        }
      }

      const response = await restClient.POST(serverHandlerPath as `/${string}`, { body, headers })
      const responseBody = await response.text()

      res.writeHead(response.status, {
        'content-type': response.headers.get('content-type') ?? 'application/json',
      })
      res.end(responseBody)
    })

    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve))
    const port = (httpServer.address() as AddressInfo).port
    handleUploadUrl = `http://127.0.0.1:${port}`
  })

  afterAll(async () => {
    httpServer.close()
    await payload.destroy()
  })

  afterEach(async () => {
    const { blobs } = await list()

    if (blobs.length > 0) {
      await del(blobs.map((b) => b.url))
    }
  })

  it('should upload a file via client upload flow', async () => {
    const file = readFileSync(path.resolve(dirname, '../uploads/image.png'))
    const pathname = 'image.png'

    const result = await upload(pathname, new Blob([file], { type: 'image/png' }), {
      access: 'public',
      clientPayload: 'media',
      contentType: 'image/png',
      handleUploadUrl,
    })

    expect(result.url).toBeDefined()
    expect(result.url).toContain(pathname)

    const { blobs } = await list()
    const uploaded = blobs.find((b) => b.pathname === pathname)
    expect(uploaded).toBeDefined()
  })

  it("should reject upload when 'x-disallow-access' header is set", async () => {
    const file = readFileSync(path.resolve(dirname, '../uploads/image.png'))

    await expect(
      upload('image.png', new Blob([file], { type: 'image/png' }), {
        access: 'public',
        clientPayload: 'media',
        handleUploadUrl,
        headers: { 'x-disallow-access': 'true' },
      }),
    ).rejects.toThrow()
  })

  it('should reject upload when no collection slug is provided', async () => {
    const file = readFileSync(path.resolve(dirname, '../uploads/image.png'))

    await expect(
      upload('image.png', new Blob([file], { type: 'image/png' }), {
        access: 'public',
        handleUploadUrl,
      }),
    ).rejects.toThrow()
  })

  it('should upload a file with prefix via client upload flow', async () => {
    const file = readFileSync(path.resolve(dirname, '../uploads/image.png'))
    const pathname = `${prefix}/image.png`

    const result = await upload(pathname, new Blob([file], { type: 'image/png' }), {
      access: 'public',
      clientPayload: 'media-with-prefix',
      contentType: 'image/png',
      handleUploadUrl,
    })

    expect(result.url).toBeDefined()
    expect(result.url).toContain(prefix)
    expect(result.url).toContain('image.png')

    const { blobs } = await list()
    const uploaded = blobs.find((b) => b.pathname === pathname)
    expect(uploaded).toBeDefined()
  })
})
