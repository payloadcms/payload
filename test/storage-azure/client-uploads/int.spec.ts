import type { ContainerClient } from '@azure/storage-blob'
import type { Payload } from 'payload'

import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob'
import { readFile } from 'node:fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'
import { mediaSlug } from '../shared.js'
import { mediaHeaderOnlySlug } from './collections/MediaHeaderOnly.js'
import { mediaHeaderOnlyWithSizesSlug } from './collections/MediaHeaderOnlyWithSizes.js'
import { mediaNoContentSlug } from './collections/MediaNoContent.js'
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

    const signedURLRes = await restClient.POST('/storage-azure-generate-signed-url', {
      body: JSON.stringify({
        collectionSlug: mediaSlug,
        filename: dupFilename,
        mimeType: 'image/png',
      }),
    })

    expect(signedURLRes.status).toBe(200)
    const { url: signedURL }: { url: string } = await signedURLRes.json()

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

  describe('content requirement retrieval paths', () => {
    const createdDocs: Array<{ collection: string; id: number | string }> = []

    afterEach(async () => {
      for (const doc of createdDocs) {
        await payload.delete({ id: doc.id, collection: doc.collection })
      }
      createdDocs.length = 0
    })

    const stageAzureClientUpload = async ({
      collectionSlug,
      file,
      filename,
      mimeType,
    }: {
      collectionSlug: string
      file: Buffer
      filename: string
      mimeType: string
    }) => {
      const signedResponse = await restClient.POST('/storage-azure-generate-signed-url', {
        body: JSON.stringify({ collectionSlug, filename, mimeType }),
      })
      expect(signedResponse.status).toBe(200)

      const signed: { docPrefix: string; filename?: string; url: string } =
        await signedResponse.json()
      const storedFilename = signed.filename || filename

      await new BlockBlobClient(signed.url).uploadData(file, {
        blobHTTPHeaders: { blobContentType: mimeType },
      })

      const form = new FormData()
      form.append(
        'file',
        JSON.stringify({
          clientUploadContext: { prefix: signed.docPrefix },
          collectionSlug,
          filename: storedFilename,
          mimeType,
          size: file.length,
        }),
      )

      return { collectionSlug, form }
    }

    it('performs no server-side download for a non-image upload needing no bytes', async () => {
      const fileBuffer = await readFile(path.resolve(dirname, '../../uploads/audio.mp3'))
      const { collectionSlug, form } = await stageAzureClientUpload({
        collectionSlug: mediaNoContentSlug,
        file: fileBuffer,
        filename: 'no-content-tripwire.mp3',
        mimeType: 'audio/mpeg',
      })

      const downloadSpy = vi.spyOn(BlockBlobClient.prototype, 'download')
      const res = await restClient.POST(`/${collectionSlug}`, { body: form })

      expect(res.status).toBe(201)
      const { doc } = await res.json()
      createdDocs.push({ id: doc.id, collection: collectionSlug })

      expect(doc.filesize).toBe(23_334)
      expect(doc.mimeType).toBe('audio/mpeg')
      expect(downloadSpy).not.toHaveBeenCalled()
      downloadSpy.mockRestore()
    })

    it('performs one bounded range download for an image needing only dimensions', async () => {
      const fileBuffer = await readFile(path.resolve(dirname, '../../uploads/2mb.jpg'))
      const { collectionSlug, form } = await stageAzureClientUpload({
        collectionSlug: mediaHeaderOnlySlug,
        file: fileBuffer,
        filename: 'header-only-tripwire.jpg',
        mimeType: 'image/jpeg',
      })

      const downloadSpy = vi.spyOn(BlockBlobClient.prototype, 'download')
      const res = await restClient.POST(`/${collectionSlug}`, { body: form })

      expect(res.status).toBe(201)
      const { doc } = await res.json()
      createdDocs.push({ id: doc.id, collection: collectionSlug })

      expect(doc.width).toBe(9000)
      expect(doc.height).toBe(9000)
      expect(doc.filesize).toBe(2_215_474)
      expect(downloadSpy).toHaveBeenCalledTimes(1)
      expect(downloadSpy).toHaveBeenCalledWith(0, 1024 * 1024, expect.anything())
      downloadSpy.mockRestore()
    })

    it('performs one full streamed download for an image needing generated sizes', async () => {
      const fileBuffer = await readFile(path.resolve(dirname, '../../uploads/2mb.jpg'))
      const { collectionSlug, form } = await stageAzureClientUpload({
        collectionSlug: mediaHeaderOnlyWithSizesSlug,
        file: fileBuffer,
        filename: 'full-content-tripwire.jpg',
        mimeType: 'image/jpeg',
      })

      const downloadSpy = vi.spyOn(BlockBlobClient.prototype, 'download')
      const res = await restClient.POST(`/${collectionSlug}`, { body: form })

      expect(res.status).toBe(201)
      const { doc } = await res.json()
      createdDocs.push({ id: doc.id, collection: collectionSlug })

      expect(doc.sizes?.thumbnail?.width).toBe(400)
      expect(doc.sizes?.thumbnail?.height).toBe(300)
      expect(downloadSpy).toHaveBeenCalledTimes(1)
      expect(downloadSpy).toHaveBeenCalledWith(0, undefined, expect.anything())
      downloadSpy.mockRestore()
    })
  })
})
