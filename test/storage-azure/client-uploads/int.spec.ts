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
  const trackedIDs: Array<number | string> = []
  const trackedMediaIDs: Array<number | string> = []
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
    for (const id of trackedIDs) {
      await payload.delete({
        collection: mediaWithDocPrefixSlug,
        where: { id: { equals: id } },
      })
    }
    trackedIDs.length = 0
    for (const id of trackedMediaIDs) {
      await payload.delete({ collection: mediaSlug, where: { id: { equals: id } } })
    }
    trackedMediaIDs.length = 0
    await clearContainer()
  })

  const seedLegacyUpload = async ({ payload }: { payload: Payload }) => {
    const file = await readFile(path.resolve(dirname, '../../uploads/image.png'))
    const filename = 'legacy.png'
    const prefix = 'legacy-invoices'

    await containerClient.getBlockBlobClient(`${prefix}/${filename}`).uploadData(file, {
      blobHTTPHeaders: { blobContentType: 'image/png' },
    })

    // Seed persisted pre-upgrade metadata directly; current upload hooks must not run.
    const doc = await payload.db.create({
      collection: mediaWithDocPrefixSlug,
      data: { filename, filesize: file.length, mimeType: 'image/png', prefix },
    })

    trackedIDs.push(doc.id)

    return { doc: { ...doc, filename, prefix }, file, key: `${prefix}/${filename}` }
  }

  it('should reject an unmatched query prefix for an existing legacy upload', async () => {
    const { doc } = await seedLegacyUpload({ payload })
    const response = await restClient.GET(
      `/${mediaWithDocPrefixSlug}/file/${doc.filename}?prefix=unmatched-prefix`,
    )

    expect(response.status).toBe(403)
  })

  it('should reuse the access-checked document for an image-size filename without a second lookup', async () => {
    const file = await readFile(path.resolve(dirname, '../../uploads/image.png'))
    const sizeFilename = 'legacy-thumbnail.png'
    const prefix = 'legacy-thumbnails'

    await containerClient.getBlockBlobClient(`${prefix}/${sizeFilename}`).uploadData(file, {
      blobHTTPHeaders: { blobContentType: 'image/png' },
    })

    const doc = await payload.db.create({
      collection: mediaWithDocPrefixSlug,
      data: {
        filename: 'legacy-original.png',
        mimeType: 'image/png',
        prefix,
        sizes: { thumbnail: { filename: sizeFilename, mimeType: 'image/png' } },
      },
    })
    trackedIDs.push(doc.id)

    const collection = payload.collections[mediaWithDocPrefixSlug].config
    const readSpy = vi.spyOn(collection.access, 'read').mockReturnValue({ id: { equals: doc.id } })
    const findSpy = vi.spyOn(payload, 'find')

    try {
      const response = await restClient.GET(`/${mediaWithDocPrefixSlug}/file/${sizeFilename}`)

      expect(response.status).toBe(200)
      expect(Buffer.from(await response.arrayBuffer())).toEqual(file)
      expect(
        findSpy.mock.calls.filter(([args]) => args.collection === mediaWithDocPrefixSlug),
      ).toHaveLength(0)
    } finally {
      readSpy.mockRestore()
      findSpy.mockRestore()
    }
  })

  /**
   * `prefix` is an ordinary writable field, so this locks in that a metadata-only request
   * cannot repoint an existing document at an object outside the collection prefix.
   * `sanitizeUploadData` drops an incoming `prefix` on update, and the containment hooks
   * are the second line of defence if that ever changes.
   */
  it('should ignore a foreign document prefix supplied without a file', async () => {
    const { doc, file } = await seedLegacyUpload({ payload })
    const foreignKey = `tenant-b/private/${doc.filename}`

    await containerClient
      .getBlockBlobClient(foreignKey)
      .uploadData(Buffer.from('another tenant object'), {
        blobHTTPHeaders: { blobContentType: 'image/png' },
      })

    const response = await restClient.PATCH(`/${mediaWithDocPrefixSlug}/${doc.id}`, {
      body: JSON.stringify({ prefix: 'tenant-b/private' }),
    })

    expect(response.status).toBe(200)

    const updated = await payload.findByID({
      id: doc.id,
      collection: mediaWithDocPrefixSlug,
    })

    expect(updated.prefix).toBe(doc.prefix)

    const fileResponse = await restClient.GET(`/${mediaWithDocPrefixSlug}/file/${doc.filename}`)

    expect(Buffer.from(await fileResponse.arrayBuffer())).toEqual(file)
    expect(await containerClient.getBlockBlobClient(foreignKey).exists()).toBe(true)
  })

  it('should prefer the exact legacy object when both old and contained keys exist', async () => {
    const { doc, file, key } = await seedLegacyUpload({ payload })
    await containerClient
      .getBlockBlobClient(`docprefix-collection/${key}`)
      .uploadData(Buffer.from('different object'))

    const response = await restClient.GET(
      `/${mediaWithDocPrefixSlug}/file/${doc.filename}?prefix=${doc.prefix}`,
    )

    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(file)
  })

  it('should delete an existing upload at its pre-upgrade object key', async () => {
    const { doc, key } = await seedLegacyUpload({ payload })

    await payload.delete({ id: doc.id, collection: mediaWithDocPrefixSlug })

    expect(await containerClient.getBlockBlobClient(key).exists()).toBe(false)
  })

  it('should replace a legacy upload inside the collection prefix and clean up its old object', async () => {
    const { doc, key } = await seedLegacyUpload({ payload })
    const updated = await payload.update({
      id: doc.id,
      collection: mediaWithDocPrefixSlug,
      data: {},
      filePath: path.resolve(dirname, '../../uploads/image.png'),
    })

    expect(updated.prefix).toBe('docprefix-collection/legacy-invoices')
    expect(
      await containerClient.getBlockBlobClient(`${updated.prefix}/${updated.filename}`).exists(),
    ).toBe(true)
    expect(await containerClient.getBlockBlobClient(key).exists()).toBe(false)
  })

  /**
   * When a doc with the same filename already exists, the signed-URL endpoint
   * should issue a unique filename so the browser PUT lands on a fresh blob
   * instead of overwriting the existing one.
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

    trackedMediaIDs.push(seedDoc.id)

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

    expect(blobKey).toMatch(/^[0-9a-f-]+\/duplicate-target-1\.png$/)

    await payload.delete({ id: seedDoc.id, collection: mediaSlug })
  })

  it('should preserve prefix.defaultValue while storing the file beneath the collection prefix', async () => {
    const upload = await payload.create({
      collection: mediaWithDocPrefixSlug,
      data: {},
      filePath: path.resolve(dirname, '../../uploads/image.png'),
    })
    trackedIDs.push(upload.id)

    expect(upload.prefix).toMatch(/^docprefix-collection\/doc-[a-z0-9]{1,8}$/)

    const props = await containerClient
      .getBlobClient(`${upload.prefix}/${upload.filename}`)
      .getProperties()
    expect(props.contentLength).toBeGreaterThan(0)
  })

  it('should keep an explicit document prefix within the configured storage prefix', async () => {
    const upload = await payload.create({
      collection: mediaWithDocPrefixSlug,
      data: { prefix: 'request-folder' },
      filePath: path.resolve(dirname, '../../uploads/image.png'),
    })
    trackedIDs.push(upload.id)

    expect(upload.prefix).toBe('docprefix-collection/request-folder')

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
