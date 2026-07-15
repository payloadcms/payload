import type { Payload, UploadInstructionsFile } from 'payload'

import { del, list } from '@vercel/blob'
import { put } from '@vercel/blob/client'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'
import { prefix } from '../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../../plugin-cloud-storage/.env.emulated') })

let payload: Payload
let restClient: NextRESTClient

const uploadInstructionsPath = '/upload-instructions'

type VercelBlobUploadInstructions = {
  data: {
    pathname: string
    token: string
  }
  file: UploadInstructionsFile
  name: 'uploadToVercelBlob'
  type: 'dispatch'
}

const uploadMetadata = (collectionSlug?: string, filesize = 1) => ({
  collectionSlug,
  filename: 'image.png',
  filesize,
  mimeType: 'image/png',
})

describe('@payloadcms/storage-vercel-blob clientUploads', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  afterEach(async () => {
    const { blobs } = await list()
    if (blobs.length > 0) {
      await del(blobs.map((b) => b.url))
    }
  })

  it('should upload a file via client upload flow', async () => {
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))
    const instructionsResponse = await restClient.POST(uploadInstructionsPath, {
      body: JSON.stringify(uploadMetadata('media', file.length)),
    })

    expect(instructionsResponse.status).toBe(200)

    const instructions = (await instructionsResponse.json()) as VercelBlobUploadInstructions
    expect(instructions.type).toBe('dispatch')
    expect(instructions.name).toBe('uploadToVercelBlob')
    expect(instructions.file).toEqual({
      uploadReference: { prefix: '' },
      filename: 'image.png',
      mimeType: 'image/png',
      size: file.length,
    })

    const result = await put(instructions.data.pathname, new Blob([file], { type: 'image/png' }), {
      access: 'public',
      contentType: 'image/png',
      token: instructions.data.token,
    })

    expect(result.url).toBeDefined()
    expect(result.url).toContain('image.png')

    const { blobs } = await list()
    const uploaded = blobs.find((b) => b.pathname === 'image.png')
    expect(uploaded).toBeDefined()
  })

  it("should reject upload when 'x-disallow-access' header is set", async () => {
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

    const response = await restClient.POST(uploadInstructionsPath, {
      body: JSON.stringify(uploadMetadata('media', file.length)),
      headers: { 'x-disallow-access': 'true' },
    })

    expect(response.status).toBe(403)
  })

  it('should reject invalid upload metadata', async () => {
    for (const body of [
      uploadMetadata(),
      uploadMetadata('constructor'),
      { ...uploadMetadata('media'), docPrefix: 1 },
    ]) {
      const response = await restClient.POST(uploadInstructionsPath, {
        body: JSON.stringify(body),
      })

      expect(response.status).toBe(400)
    }
  })

  it('should upload a file with prefix via client upload flow', async () => {
    const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))
    const instructionsResponse = await restClient.POST(uploadInstructionsPath, {
      body: JSON.stringify(uploadMetadata('media-with-prefix', file.length)),
    })
    const instructions = (await instructionsResponse.json()) as VercelBlobUploadInstructions

    const result = await put(instructions.data.pathname, new Blob([file], { type: 'image/png' }), {
      access: 'public',
      contentType: 'image/png',
      token: instructions.data.token,
    })

    expect(result.url).toBeDefined()
    expect(result.url).toContain(prefix)
    expect(result.url).toContain('image.png')

    const { blobs } = await list()
    const uploaded = blobs.find((b) => b.pathname === `${prefix}/image.png`)
    expect(uploaded).toBeDefined()
  })
})
