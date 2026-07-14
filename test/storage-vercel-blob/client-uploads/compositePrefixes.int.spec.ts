import type { Payload } from 'payload'

import { del, list } from '@vercel/blob'
import { put } from '@vercel/blob/client'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'
import { collectionPrefix, mediaWithCompositePrefixesSlug } from '../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../../plugin-cloud-storage/.env.emulated') })

let payload: Payload
let restClient: NextRESTClient

const createdDocIDs: Array<number | string> = []

describe('@payloadcms/storage-vercel-blob clientUploads (composite prefixes)', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(
      dirname,
      undefined,
      true,
      'config.compositePrefixes.ts',
    ))
  })

  afterAll(async () => {
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
    const uploadedFilename = 'client-composite-image.png'
    const pathname = `${collectionPrefix}/${docPrefix}/${uploadedFilename}`
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

    const instructionsResponse = await restClient.POST('/upload-instructions', {
      body: JSON.stringify({
        collectionSlug: mediaWithCompositePrefixesSlug,
        docPrefix,
        filename: uploadedFilename,
        filesize: file.length,
        mimeType: 'image/png',
      }),
    })
    const instructions = (await instructionsResponse.json()) as {
      data: { pathname: string; token: string }
      file: {
        directUpload: { prefix: string }
        filename: string
        mimeType: string
        size: number
      }
    }

    expect(instructions.data.pathname).toBe(pathname)

    await put(instructions.data.pathname, new Blob([file], { type: 'image/png' }), {
      access: 'public',
      contentType: 'image/png',
      token: instructions.data.token,
    })

    const formData = new FormData()

    // build formData like the admin panel does
    formData.append(
      '_payload',
      JSON.stringify({
        prefix: docPrefix,
      }),
    )
    formData.append('file', JSON.stringify(instructions.file))

    const createResponse = await restClient.POST(`/${mediaWithCompositePrefixesSlug}`, {
      body: formData,
    })

    expect(createResponse.status).toBe(201)

    const createdDoc = await createResponse.json()

    expect(createdDoc?.doc.prefix).toBe(docPrefix)

    const fileResponse = await restClient.GET(
      `/${mediaWithCompositePrefixesSlug}/file/${uploadedFilename}?prefix=${encodeURIComponent(docPrefix)}`,
    )

    expect(fileResponse.status).toBe(200)
    const fileBuffer = await fileResponse.arrayBuffer()
    expect(fileBuffer.byteLength).toBeGreaterThan(0)
  })
})
