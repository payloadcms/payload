import type { Payload } from 'payload'

import { BlobServiceClient } from '@azure/storage-blob'
import { readFile } from 'node:fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import {
  azureBaseURL,
  azureConnectionString,
  privateContainerName,
  privateMediaSlug,
  publicContainerName,
  publicMediaSlug,
} from './publicAccess.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let restClient: NextRESTClient
let payload: Payload

const uploadImage = async (slug: string) => {
  const fileBuffer = await readFile(`${dirname}/../uploads/image.png`)

  const data = new FormData()
  data.append('file', new Blob([fileBuffer], { type: 'image/png' }), 'anon-probe.png')

  const response = await restClient.POST(`/${slug}`, { body: data })
  const { doc } = await response.json()

  return doc
}

describe('@payloadcms/storage-azure container access', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(
      dirname,
      undefined,
      undefined,
      path.resolve(dirname, 'publicAccess.config.ts'),
    ))
  }, 90000)

  afterAll(async () => {
    const blobServiceClient = BlobServiceClient.fromConnectionString(azureConnectionString)

    await blobServiceClient.getContainerClient(privateContainerName).deleteIfExists()
    await blobServiceClient.getContainerClient(publicContainerName).deleteIfExists()
    await payload.destroy()
  })

  it('should reject anonymous access to a plugin-created private container while the Payload route still serves the file', async () => {
    const doc = await uploadImage(privateMediaSlug)

    // Anonymous GET straight to Azure must be blocked. Private containers return
    // 403, or 404 when the account disallows public access.
    const directResponse = await fetch(`${azureBaseURL}/${privateContainerName}/${doc.filename}`)

    expect([401, 403, 404]).toContain(directResponse.status)

    // The Payload route reads with credentials, so it still serves the file.
    const payloadResponse = await restClient.GET(doc.url.replace(/^\/api/, '') as `/${string}`)

    expect(payloadResponse.status).toBe(200)
  })

  it('should allow anonymous access when the container is created with an explicit public opt-in', async () => {
    const doc = await uploadImage(publicMediaSlug)

    const directResponse = await fetch(`${azureBaseURL}/${publicContainerName}/${doc.filename}`)

    expect(directResponse.status).toBe(200)
  })
})
