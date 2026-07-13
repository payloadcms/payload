import type { ContainerClient } from '@azure/storage-blob'
import type { Payload, UploadInstructions } from 'payload'

import { BlobServiceClient } from '@azure/storage-blob'
import { readFile } from 'node:fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'
import { mediaSlug } from '../shared.js'
import { mediaWithDocPrefixSlug } from './collections/MediaWithDocPrefix.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload
let restClient: NextRESTClient
let containerClient: ContainerClient
let TEST_CONTAINER: string

describe('@payloadcms/storage-azure clientUploads', () => {
  const clearContainer = async () => {
    for await (const blob of containerClient.listBlobsFlat()) {
      await containerClient.deleteBlob(blob.name)
    }
  }

  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    TEST_CONTAINER = process.env.AZURE_STORAGE_CONTAINER_NAME!
    containerClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!,
    ).getContainerClient(TEST_CONTAINER)
    await containerClient.createIfNotExists()
    await clearContainer()
  }, 90000)

  afterAll(async () => {
    await payload.destroy()
  })

  afterEach(async () => {
    await clearContainer()
  })

  /**
   * When a doc with the same filename already exists, the signed-URL endpoint
   * should sanitize the filename (e.g. `duplicate-target-1.png`) so the
   * browser PUT lands on a fresh blob instead of overwriting the existing one.
   */
  it('sanitizes the filename when a duplicate already exists', async () => {
    const dupFilename = 'duplicate-target.png'
    const fileBuffer = await readFile(`${dirname}/../../uploads/image.png`)

    const seedForm = new FormData()
    seedForm.append('file', new Blob([fileBuffer], { type: 'image/png' }), dupFilename)
    const seedRes = await restClient.POST(`/${mediaSlug}`, { body: seedForm })

    expect(seedRes.status).toBe(201)
    const { doc: seedDoc }: { doc: { filename: string; id: number | string } } =
      await seedRes.json()

    expect(seedDoc.filename).toBe(dupFilename)

    const signedURLRes = await restClient.POST('/upload-instructions', {
      body: JSON.stringify({
        collectionSlug: mediaSlug,
        filename: dupFilename,
        filesize: fileBuffer.length,
        mimeType: 'image/png',
      }),
    })

    expect(signedURLRes.status).toBe(200)
    const instructions = (await signedURLRes.json()) as UploadInstructions
    expect(instructions.type).toBe('http')
    expect(instructions.filename).toBe('duplicate-target-1.png')
    expect(instructions.clientUploadContext).toEqual({ prefix: '' })

    if (instructions.type !== 'http') {
      throw new Error('Expected HTTP upload instructions')
    }

    expect(instructions.request.method).toBe('PUT')
    expect(instructions.request.headers).toHaveProperty('x-ms-blob-type', 'BlockBlob')
    const signedURL = instructions.request.url

    const blobKey = decodeURIComponent(
      new URL(signedURL).pathname.replace(`/devstoreaccount1/${TEST_CONTAINER}/`, ''),
    )

    expect(blobKey).toBe('duplicate-target-1.png')

    await payload.delete({ id: seedDoc.id, collection: mediaSlug })
  })

  it('preserves a user-defined prefix.defaultValue across the plugin', async () => {
    const upload = await payload.create({
      collection: mediaWithDocPrefixSlug,
      data: {},
      filePath: path.resolve(dirname, '../../uploads/image.png'),
    })

    expect(upload.prefix).toMatch(/^doc-[a-z0-9]{1,8}$/)

    const props = await containerClient
      .getBlobClient(`${upload.prefix}/${upload.filename}`)
      .getProperties()
    expect(props.contentLength).toBeGreaterThan(0)
  })
})
