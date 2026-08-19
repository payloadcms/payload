import type { ContainerClient } from '@azure/storage-blob'
import type { Payload, UploadInstructions } from 'payload'

import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { expect, vi } from 'vitest'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

import { test } from '../../__helpers/int/vitest.js'
import { mediaSlug } from '../shared.js'
import { mediaHeaderOnlySlug } from './collections/MediaHeaderOnly.js'
import { mediaHeaderOnlyWithSizesSlug } from './collections/MediaHeaderOnlyWithSizes.js'
import { mediaWithDocPrefixSlug } from './collections/MediaWithDocPrefix.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
let containerClient: ContainerClient
let TEST_CONTAINER: string

test.suite({ config: './config.ts' })('@payloadcms/storage-azure clientUploads', () => {
  const clearContainer = async () => {
    for await (const blob of containerClient.listBlobsFlat()) {
      await containerClient.deleteBlob(blob.name)
    }
  }

  /**
   * Completes the browser-equivalent side of a client upload (requesting upload instructions,
   * then PUTting the file straight to Azure) and returns the form data for the follow-up document
   * POST. Callers must install any `BlockBlobClient` spies after this resolves, so the browser's
   * own Azure SDK calls don't pollute server-side read-count assertions.
   */
  const stageAzureClientUpload = async ({
    collectionSlug,
    file,
    filename,
    mimeType,
    restClient,
  }: {
    collectionSlug: string
    file: Buffer
    filename: string
    mimeType: string
    restClient: NextRESTClient
  }) => {
    const instructions = (await restClient
      .POST('/upload-instructions', {
        body: JSON.stringify({
          collectionSlug,
          filename,
          filesize: file.length,
          mimeType,
        }),
      })
      .then((res) => res.json())) as UploadInstructions

    if (instructions.type !== 'dispatch') {
      throw new Error('Expected dispatch upload instructions')
    }

    const { url } = instructions.data as { url: string }
    await new BlockBlobClient(url).uploadData(file, {
      blobHTTPHeaders: { blobContentType: mimeType },
    })

    const form = new FormData()
    form.append('file', JSON.stringify(instructions.file))

    return form
  }

  test.beforeEach(async () => {
    TEST_CONTAINER = process.env.AZURE_STORAGE_CONTAINER_NAME!
    containerClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!,
    ).getContainerClient(TEST_CONTAINER)
    await containerClient.createIfNotExists()
    await clearContainer()
  }, 90000)

  test.afterEach(async () => {
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

    return { doc: { ...doc, filename, prefix }, file, key: `${prefix}/${filename}` }
  }

  test('should reject an unmatched query prefix for an existing legacy upload', async ({
    payload,
    restClient,
  }) => {
    const { doc } = await seedLegacyUpload({ payload })
    const response = await restClient.GET(
      `/${mediaWithDocPrefixSlug}/file/${doc.filename}?prefix=unmatched-prefix`,
    )

    expect(response.status).toBe(403)
  })

  test('should reuse the access-checked document for an image-size filename without a second lookup', async ({
    payload,
    restClient,
  }) => {
    const file = await readFile(path.resolve(dirname, '../../uploads/image.png'))
    const sizeFilename = 'legacy-thumbnail.png'
    const prefix = 'legacy-thumbnails'

    await containerClient.getBlockBlobClient(`${prefix}/${sizeFilename}`).uploadData(file, {
      blobHTTPHeaders: { blobContentType: 'image/png' },
    })

    const doc = await payload.db.create({
      collection: mediaHeaderOnlyWithSizesSlug,
      data: {
        filename: 'legacy-original.png',
        mimeType: 'image/png',
        prefix,
        sizes: { thumbnail: { filename: sizeFilename, mimeType: 'image/png' } },
      },
    })
    const collection = payload.collections[mediaHeaderOnlyWithSizesSlug].config
    const originalRead = collection.access.read
    const findSpy = vi.spyOn(payload, 'find')

    collection.access.read = () => ({ id: { equals: doc.id } })

    try {
      const response = await restClient.GET(`/${mediaHeaderOnlyWithSizesSlug}/file/${sizeFilename}`)

      expect(response.status).toBe(200)
      expect(Buffer.from(await response.arrayBuffer())).toEqual(file)
      expect(
        findSpy.mock.calls.filter(([args]) => args.collection === mediaHeaderOnlyWithSizesSlug),
      ).toHaveLength(0)
    } finally {
      collection.access.read = originalRead
      findSpy.mockRestore()
    }
  })

  /**
   * `prefix` is an ordinary writable field, so this locks in that a metadata-only request
   * cannot repoint an existing document at an object outside the collection prefix.
   * `sanitizeUploadData` drops an incoming `prefix` on update, and the containment hooks
   * are the second line of defence if that ever changes.
   */
  test('should ignore a foreign document prefix supplied without a file', async ({
    payload,
    restClient,
  }) => {
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

  test('should prefer the exact legacy object when both old and contained keys exist', async ({
    payload,
    restClient,
  }) => {
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

  test('should delete an existing upload at its pre-upgrade object key', async ({ payload }) => {
    const { doc, key } = await seedLegacyUpload({ payload })

    await payload.delete({ collection: mediaWithDocPrefixSlug, id: doc.id })

    expect(await containerClient.getBlockBlobClient(key).exists()).toBe(false)
  })

  test('should replace a legacy upload inside the collection prefix and clean up its old object', async ({
    payload,
  }) => {
    const { doc, key } = await seedLegacyUpload({ payload })
    const updated = await payload.update({
      collection: mediaWithDocPrefixSlug,
      id: doc.id,
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
   * When a doc with the same filename already exists, the upload-instructions
   * endpoint dedupes the filename (duplicate-target-1.png) and issues an
   * prefixed key (e.g. `<uuid>/duplicate-target-1.png`) so the
   * browser SDK upload lands on a fresh blob instead of overwriting the existing one.
   */
  test('should issue a unique filename when a duplicate already exists', async ({
    payload,
    restClient,
  }) => {
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
      uploadReference: {
        _objectKey: expect.stringMatching(/^[0-9a-f-]+$/),
        prefix: '',
        signedReceipt: expect.any(String),
      },
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

    expect(blobKey).toMatch(/^[0-9a-f-]+\/duplicate-target-1\.png$/)

    await payload.delete({ id: seedDoc.id, collection: mediaSlug, overrideAccess: true })
  })

  test('should preserve prefix.defaultValue while storing the file beneath the collection prefix', async ({
    payload,
  }) => {
    const upload = await payload.create({
      collection: mediaWithDocPrefixSlug,
      data: {},
      filePath: path.resolve(dirname, '../../uploads/image.png'),
      overrideAccess: true,
    })

    expect(upload.prefix).toMatch(/^docprefix-collection\/doc-[a-z0-9]{1,8}$/)

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
   *
   * The same collection also covers the `'none'` content requirement: content requirement
   * depends on the uploaded MIME type as well as collection configuration, so `audio/mpeg`
   * selects `'none'` while `image/jpeg` selects `'header'`.
   */
  test.describe('header-only and no-content requirements (real Azure handler)', () => {
    const createdIds: (number | string)[] = []

    test.afterEach(async ({ payload }) => {
      for (const id of createdIds) {
        await payload.delete({ id, collection: mediaHeaderOnlySlug, overrideAccess: true })
      }
      createdIds.length = 0
    })

    test('does not read a client-uploaded non-image when metadata is sufficient', async ({
      restClient,
    }) => {
      const file = readFileSync(path.resolve(dirname, '../../uploads/audio.mp3'))
      expect(file.length).toBe(23_334)

      const form = await stageAzureClientUpload({
        collectionSlug: mediaHeaderOnlySlug,
        file,
        filename: 'no-content-tripwire.mp3',
        mimeType: 'audio/mpeg',
        restClient,
      })

      const getPropertiesSpy = vi.spyOn(BlockBlobClient.prototype, 'getProperties')
      const downloadSpy = vi.spyOn(BlockBlobClient.prototype, 'download')

      try {
        const createRes = await restClient.POST(`/${mediaHeaderOnlySlug}`, { body: form })
        expect(createRes.status).toBe(201)

        const { doc } = await createRes.json()
        createdIds.push(doc.id)

        expect(doc.filesize).toBe(23_334)
        expect(doc.mimeType).toBe('audio/mpeg')
        expect(getPropertiesSpy).not.toHaveBeenCalled()
        expect(downloadSpy).not.toHaveBeenCalled()
      } finally {
        getPropertiesSpy.mockRestore()
        downloadSpy.mockRestore()
      }
    })

    test('creates a document from a client-uploaded image via the real Azure handler', async ({
      restClient,
    }) => {
      const file = readFileSync(path.resolve(dirname, '../../uploads/2mb.jpg'))
      expect(file.length).toBe(2_215_474)

      const form = await stageAzureClientUpload({
        collectionSlug: mediaHeaderOnlySlug,
        file,
        filename: 'header-only-tripwire.jpg',
        mimeType: 'image/jpeg',
        restClient,
      })

      const getPropertiesSpy = vi.spyOn(BlockBlobClient.prototype, 'getProperties')
      const downloadSpy = vi.spyOn(BlockBlobClient.prototype, 'download')

      try {
        const createRes = await restClient.POST(`/${mediaHeaderOnlySlug}`, { body: form })
        expect(createRes.status).toBe(201)

        const { doc } = await createRes.json()
        createdIds.push(doc.id)

        expect(doc.width).toBe(9000)
        expect(doc.height).toBe(9000)
        expect(doc.filesize).toBe(2_215_474)
        expect(doc.mimeType).toBe('image/jpeg')

        expect(getPropertiesSpy).toHaveBeenCalledTimes(1)
        expect(downloadSpy).toHaveBeenCalledTimes(1)

        const [offset, count] = downloadSpy.mock.calls[0]!
        expect(offset).toBe(0)
        expect(count).toBe(1024 * 1024)
      } finally {
        getPropertiesSpy.mockRestore()
        downloadSpy.mockRestore()
      }
    })
  })

  /**
   * `media-header-only-with-sizes` has `imageSizes` configured but no `resizeOptions`, so a
   * client upload larger than `HEADER_PROBE_BYTE_LENGTH` (1MB) is a regression test for a bug
   * where `getFileContentRequirement` ignored `imageSizes` and chose the `'header'` content
   * requirement anyway - handing `createImageSizes` a truncated buffer and crashing instead of
   * fetching the full file through the real Azure handler.
   */
  test.describe('imageSizes with a large upload (real Azure handler)', () => {
    const createdIds: (number | string)[] = []

    test.afterEach(async ({ payload }) => {
      for (const id of createdIds) {
        await payload.delete({ id, collection: mediaHeaderOnlyWithSizesSlug, overrideAccess: true })
      }
      createdIds.length = 0
    })

    test('creates a document and generates image sizes from a large client-uploaded image via the real Azure handler', async ({
      restClient,
    }) => {
      const file = readFileSync(path.resolve(dirname, '../../uploads/2mb.jpg'))
      expect(file.length).toBe(2_215_474)

      const form = await stageAzureClientUpload({
        collectionSlug: mediaHeaderOnlyWithSizesSlug,
        file,
        filename: 'large-with-sizes.jpg',
        mimeType: 'image/jpeg',
        restClient,
      })

      const downloadSpy = vi.spyOn(BlockBlobClient.prototype, 'download')

      try {
        const createRes = await restClient.POST(`/${mediaHeaderOnlyWithSizesSlug}`, {
          body: form,
        })

        expect(createRes.status).toBe(201)
        const { doc } = await createRes.json()
        createdIds.push(doc.id)

        expect(doc.filesize).toBe(file.length)
        expect(doc.mimeType).toBe('image/jpeg')
        expect(doc.sizes.thumbnail.width).toBe(400)
        expect(doc.sizes.thumbnail.height).toBe(300)
        expect(doc.sizes.thumbnail.filename).toBeTruthy()

        expect(downloadSpy).toHaveBeenCalledTimes(1)

        const [offset, count] = downloadSpy.mock.calls[0]!
        expect(offset).toBe(0)
        expect(count).toBeUndefined()
      } finally {
        downloadSpy.mockRestore()
      }
    }, 60000)
  })
})
