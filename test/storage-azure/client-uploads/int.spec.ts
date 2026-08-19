import type { ContainerClient } from '@azure/storage-blob'
import type { Payload, UploadInstructions } from 'payload'

import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'
import { mediaSlug } from '../shared.js'
import { mediaHeaderOnlySlug } from './collections/MediaHeaderOnly.js'
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
   * When a doc with the same filename already exists, the upload-instructions
   * endpoint should sanitize the filename (e.g. `duplicate-target-1.png`) so the
   * browser SDK upload lands on a fresh blob instead of overwriting the existing one.
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
    expect(instructions.type).toBe('dispatch')
    expect(instructions.file).toEqual({
      uploadReference: { prefix: '' },
      filename: 'duplicate-target-1.png',
      mimeType: 'image/png',
      size: fileBuffer.length,
    })

    if (instructions.type !== 'dispatch') {
      throw new Error('Expected dispatch upload instructions')
    }

    expect(instructions.name).toBe('uploadToAzure')
    const { url: signedURL } = instructions.data as { url: string }

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

  /**
   * `media-header-only` has no resizeOptions/mimeTypes configured, so a plain image upload
   * takes the `'header'` content-requirement path: the server only fetches a byte-range probe
   * from the real Azure handler instead of the whole file. This is a regression test for a bug
   * where that path crashed against the real adapter (it reads `req.signal`, which threw when
   * the server cloned the request via `Object.create` to add the range header) - completing the
   * full round trip end to end is the only way to exercise the real handler for this path, since
   * unit tests mock the handler and never see that crash.
   */
  describe('header-only content requirement (real Azure handler)', () => {
    const createdIds: (number | string)[] = []

    afterEach(async () => {
      for (const id of createdIds) {
        await payload.delete({ id, collection: mediaHeaderOnlySlug })
      }
      createdIds.length = 0
    })

    it('creates a document from a client-uploaded image via the real Azure handler', async () => {
      const file = readFileSync(path.resolve(dirname, '../../uploads/image.png'))

      const instructions = (await restClient
        .POST('/upload-instructions', {
          body: JSON.stringify({
            collectionSlug: mediaHeaderOnlySlug,
            filename: 'header-only.png',
            filesize: file.length,
            mimeType: 'image/png',
          }),
        })
        .then((res) => res.json())) as UploadInstructions

      if (instructions.type !== 'dispatch') {
        throw new Error('Expected dispatch upload instructions')
      }

      const { url } = instructions.data as { url: string }
      await new BlockBlobClient(url).uploadData(file, {
        blobHTTPHeaders: { blobContentType: 'image/png' },
      })

      const createFormData = new FormData()
      createFormData.append('file', JSON.stringify(instructions.file))

      const createRes = await restClient.POST(`/${mediaHeaderOnlySlug}`, {
        body: createFormData,
      })

      expect(createRes.status).toBe(201)
      const { doc } = await createRes.json()
      createdIds.push(doc.id)

      expect(doc.width).toBe(1600)
      expect(doc.height).toBe(1600)
      expect(doc.filesize).toBe(file.length)
      expect(doc.mimeType).toBe('image/png')
    })
  })
})
