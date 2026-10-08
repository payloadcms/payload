import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { Document, Payload } from 'payload'

import { del, list } from '@vercel/blob'
import { upload } from '@vercel/blob/client'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { createServer } from 'node:http'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'
import { mediaWithCompositePrefixesSlug } from '../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../../plugin-cloud-storage/.env.emulated') })

let payload: Payload
let restClient: NextRESTClient
let httpServer: Server
let handleUploadUrl: string

const createdDocIDs: Array<number | string> = []
const serverHandlerPath = '/vercel-blob-client-upload-route'

describe('@payloadcms/storage-vercel-blob clientUploads (composite prefixes)', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(
      dirname,
      undefined,
      true,
      'config.compositePrefixes.ts',
    ))

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
    for (const id of createdDocIDs) {
      await payload.delete({
        id,
        collection: mediaWithCompositePrefixesSlug,
      })
    }

    createdDocIDs.length = 0

    const { blobs } = await list()
    if (blobs.length > 0) {
      await del(blobs.map((b) => b.url))
    }
  })

  it('should fetch a client-uploaded file using collection and document prefixes', async () => {
    const docPrefix = 'document-prefix'
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))
    const issued = await restClient
      .POST(`${serverHandlerPath}?issue-client-upload=1`, {
        body: JSON.stringify({
          collectionSlug: mediaWithCompositePrefixesSlug,
          docPrefix,
          filename: 'client-composite-image.png',
          mimeType: 'image/png',
        }),
      })
      .then((res) =>
        res.json<{
          clientUploadContext: { prefix: string; signedReceipt: string }
          filename: string
          pathname: string
        }>(),
      )

    // Upload the file to Vercel Blob with the same collection and document prefixes that the client upload handler would use
    //
    await upload(issued.pathname, new Blob([file], { type: 'image/png' }), {
      access: 'public',
      clientPayload: JSON.stringify({
        collectionSlug: mediaWithCompositePrefixesSlug,
        mimeType: 'image/png',
        signedReceipt: issued.clientUploadContext.signedReceipt,
      }),
      contentType: 'image/png',
      handleUploadUrl,
    })

    const formData = new FormData()

    // build formData like the admin panel does
    formData.append(
      '_payload',
      JSON.stringify({
        prefix: docPrefix,
      }),
    )
    formData.append(
      'file',
      JSON.stringify({
        clientUploadContext: issued.clientUploadContext,
        collectionSlug: mediaWithCompositePrefixesSlug,
        filename: issued.filename,
        mimeType: 'image/png',
        size: file.length,
      }),
    )

    const createResponse = await restClient.POST(`/${mediaWithCompositePrefixesSlug}`, {
      body: formData,
    })

    expect(createResponse.status).toBe(201)

    const createdDoc = (await createResponse.json()) as Document

    expect(createdDoc?.doc.prefix).toBe(issued.clientUploadContext.prefix)

    const fileResponse = await restClient.GET(
      `/${mediaWithCompositePrefixesSlug}/file/${issued.filename}?prefix=${encodeURIComponent(issued.clientUploadContext.prefix)}`,
    )

    expect(fileResponse.status).toBe(200)
    const fileBuffer = await fileResponse.arrayBuffer()
    expect(fileBuffer.byteLength).toBeGreaterThan(0)
  })
})
