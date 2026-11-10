import type { Payload } from 'payload'

import { existsSync } from 'node:fs'
import { readdir, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  getStoredCloudFiles,
  versionedCloudFiles,
} from '../plugin-cloud-storage/versionedCloudStorage.js'
import { sourceReadCalls, sourceReadDocumentIDs } from './collections/DynamicMedia.js'
import {
  versionedCloudMediaSlug,
  versionedDynamicMediaDir,
  versionedDynamicMediaSlug,
} from './shared.js'
import { uploadCropSources } from './transformers.js'

const imageFixture = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../uploads/image.png',
)
const savedCrop = { height: 600, width: 800, x: 100, y: 200 }
// These adapters cannot roll back a document write, so a failed restore keeps the files it saved.
const adaptersWithoutTransactions = [
  'cosmosdb',
  'firestore',
  'sqlite',
  'sqlite-uuid',
  'sqlite-uuidv7',
]
const laterCrop = { height: 200, width: 300, x: 0, y: 0 }

const getVersions = async ({
  payload,
  id,
  collection = versionedDynamicMediaSlug,
}: {
  collection?: typeof versionedCloudMediaSlug | typeof versionedDynamicMediaSlug
  id: number | string
  payload: Payload
}) =>
  (
    await payload.db.findVersions({
      collection,
      pagination: false,
      sort: '-updatedAt',
      where: { parent: { equals: id } },
    })
  ).docs

const prepareHistory = async ({
  payload,
  collection = versionedDynamicMediaSlug,
  replaceOriginal = false,
}: {
  collection?: typeof versionedCloudMediaSlug | typeof versionedDynamicMediaSlug
  payload: Payload
  replaceOriginal?: boolean
}) => {
  const bytes = await readFile(imageFixture)
  const created = await payload.create({
    collection,
    data: { _status: 'published', _transforms: { crop: savedCrop }, alt: 'selected' },
    file: { data: bytes, mimetype: 'image/png', name: 'restore.png', size: bytes.length },
  })

  const replacement = replaceOriginal ? await sharp(bytes).negate().toBuffer() : undefined

  await payload.update({
    id: created.id,
    collection,
    data: { _transforms: { crop: laterCrop }, alt: 'current' },
    file: replacement && {
      data: replacement,
      mimetype: 'image/png',
      name: 'replacement.png',
      size: replacement.length,
    },
  })

  const docs = await getVersions({ payload, id: created.id, collection })
  const selected = docs.find(({ version }) => version._transforms?.crop?.width === savedCrop.width)!

  expect(selected).toBeDefined()
  sourceReadCalls.length = 0

  return { created, selected }
}

test.suite('Restore request-time files', { config: './config.ts' }, () => {
  test.afterEach(async () => {
    vi.restoreAllMocks()
    sourceReadCalls.length = 0
    versionedCloudFiles.clear()
    await rm(versionedDynamicMediaDir, { force: true, recursive: true })
  })

  test('should read the retained original from a temp file when restoring through the upload pipeline, and remove it', async ({
    payload,
  }) => {
    const { created, selected } = await prepareHistory({ payload, replaceOriginal: true })
    uploadCropSources.length = 0
    sourceReadDocumentIDs.length = 0

    await payload.restoreVersion({
      id: String(selected.id),
      collection: versionedDynamicMediaSlug,
      context: { isUploadCropEnabled: true },
      overrideAccess: true,
    })

    expect(new Set(sourceReadDocumentIDs)).toEqual(new Set([created.id]))
    expect(uploadCropSources).toEqual([{ tempFilePath: expect.any(String) }])
    expect(existsSync(uploadCropSources[0]!.tempFilePath!)).toBe(false)
  })

  test('should replay saved transforms through the current upload pipeline when restoring a dynamic file', async ({
    payload,
    restClient,
  }) => {
    const { created, selected } = await prepareHistory({ payload, replaceOriginal: true })
    const before = structuredClone(selected.version)
    const filesBeforeRestore = new Set(await readdir(versionedDynamicMediaDir))
    const restored = await payload.restoreVersion({
      id: String(selected.id),
      collection: versionedDynamicMediaSlug,
      context: { isUploadCropEnabled: true },
      overrideAccess: true,
    })

    expect(restored._stored).not.toBe(false)
    expect(restored._transforms).toEqual({ crop: savedCrop })
    expect(restored).toMatchObject({ height: 600, width: 800 })
    expect(
      await readFile(path.join(versionedDynamicMediaDir, restored.original!.filename!)),
    ).toEqual(await readFile(imageFixture))

    const versions = await getVersions({ payload, id: created.id })
    expect(versions.find(({ id }) => id === selected.id)!.version).toEqual(before)
    expect(restored.id).toBe(created.id)
    const latest = versions.find(({ latest }) => latest)!
    expect(latest.version.url).toBe(`/api/${versionedDynamicMediaSlug}/file/${restored.filename}`)
    const response = await restClient.GET(
      `/${versionedDynamicMediaSlug}/file/${restored.filename}?version=${latest.id}`,
    )
    expect(response.status).toBe(200)
    const selectedOutput = await sharp(await readFile(imageFixture))
      .extract({
        left: savedCrop.x,
        top: savedCrop.y,
        width: savedCrop.width,
        height: savedCrop.height,
      })
      .toBuffer()
    expect(Buffer.from(await response.arrayBuffer())).toEqual(selectedOutput)
    await payload.delete({ id: restored.id, collection: versionedDynamicMediaSlug, trash: false })
    const remainingFiles = await readdir(versionedDynamicMediaDir)
    expect(remainingFiles).not.toContain(restored.filename)
    expect(remainingFiles.filter((filename) => !filesBeforeRestore.has(filename))).toEqual([])
  })

  test('should reject unsupported restored transforms before changing stored files or the current document', async ({
    payload,
  }) => {
    const { created, selected } = await prepareHistory({ payload })
    const transformer = payload.config.upload.transformers.find(
      ({ slug }) => slug === 'request-crop',
    )!
    const beforeFiles = await readdir(versionedDynamicMediaDir)
    const before = await payload.db.findOne({
      collection: versionedDynamicMediaSlug,
      where: { id: { equals: created.id } },
    })

    vi.spyOn(transformer, 'canTransform').mockReturnValue(false)

    await expect(
      payload.restoreVersion({
        id: String(selected.id),
        collection: versionedDynamicMediaSlug,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
    expect(await readdir(versionedDynamicMediaDir)).toEqual(beforeFiles)
    expect(
      await payload.db.findOne({
        collection: versionedDynamicMediaSlug,
        where: { id: { equals: created.id } },
      }),
    ).toEqual(before)
    expect(sourceReadCalls).toHaveLength(0)
  })

  test('should restore a request-time file without reading source bytes and serve the restored crop', async ({
    payload,
    restClient,
  }) => {
    const { selected } = await prepareHistory({ payload })
    const restored = await payload.restoreVersion({
      id: String(selected.id),
      collection: versionedDynamicMediaSlug,
      overrideAccess: true,
    })

    expect(sourceReadCalls).toHaveLength(0)
    expect(restored._stored).toBe(false)
    expect(restored.filename).toBe(restored.original?.filename)
    expect(restored._transforms).toEqual({ crop: savedCrop })

    const response = await restClient.GET(`/${versionedDynamicMediaSlug}/file/${restored.filename}`)

    expect(response.status).toBe(200)
    expect(await sharp(Buffer.from(await response.arrayBuffer())).metadata()).toMatchObject({
      height: 600,
      width: 800,
    })
  })

  test('should reconcile virtual variants with the current size declarations', async ({
    payload,
  }) => {
    const { selected } = await prepareHistory({ payload })
    const upload = payload.collections[versionedDynamicMediaSlug].config.upload
    const variants = upload.variants
    try {
      upload.variants = []
      const removed = await payload.restoreVersion({
        id: String(selected.id),
        collection: versionedDynamicMediaSlug,
        overrideAccess: true,
      })
      const versions = await getVersions({ payload, id: removed.id })
      const withoutVariants = versions.find(({ latest }) => latest)!
      expect(withoutVariants.version.variants?.card?.filename).toBeFalsy()
      expect(withoutVariants.version.variants?.card?._stored).not.toBe(false)

      upload.variants = variants
      const restored = await payload.restoreVersion({
        id: String(withoutVariants.id),
        collection: versionedDynamicMediaSlug,
        overrideAccess: true,
      })
      expect(restored.variants?.card).toMatchObject({
        _stored: false,
        filesize: null,
        height: null,
        width: null,
      })
      expect(restored.variants?.card?.filename).toBeTruthy()
      expect(sourceReadCalls).toHaveLength(0)
    } finally {
      upload.variants = variants
    }
  })

  test('should replay virtual variants with a stored main and focal-only transforms', async ({
    payload,
    restClient,
  }) => {
    const created = await payload.create({
      collection: versionedDynamicMediaSlug,
      data: { _transforms: { focalPoint: { x: 25, y: 75 } } },
      filePath: imageFixture,
    })
    expect(created._stored).not.toBe(false)
    expect(created.variants?.card?._stored).toBe(false)
    const docs = await getVersions({ payload, id: created.id })
    await payload.update({
      id: created.id,
      collection: versionedDynamicMediaSlug,
      data: { _transforms: { crop: laterCrop } },
    })
    sourceReadCalls.length = 0
    const restored = await payload.restoreVersion({
      id: String(docs[0]!.id),
      collection: versionedDynamicMediaSlug,
      overrideAccess: true,
    })
    expect(restored._stored).not.toBe(false)
    expect(restored._transforms).toEqual({ focalPoint: { x: 25, y: 75 } })
    expect(restored.variants?.card).toMatchObject({
      _stored: false,
      filesize: null,
      height: null,
      width: null,
    })
    expect(sourceReadCalls).toHaveLength(0)
    const versions = await getVersions({ payload, id: restored.id })
    const latest = versions.find(({ latest }) => latest)!
    expect(latest.version.url).toBe(`/api/${versionedDynamicMediaSlug}/file/${restored.filename}`)
    const response = await restClient.GET(
      `/${versionedDynamicMediaSlug}/file/${restored.filename}?version=${latest.id}`,
    )
    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(await readFile(imageFixture))
  })

  test('should keep all locales and file identity when the response selects only a custom field', async ({
    payload,
  }) => {
    const created = await payload.create({
      collection: versionedDynamicMediaSlug,
      data: { _transforms: { crop: savedCrop }, alt: 'English' },
      locale: 'en',
      filePath: imageFixture,
    })
    await payload.update({
      id: created.id,
      collection: versionedDynamicMediaSlug,
      locale: 'es',
      data: { alt: 'Español' },
    })
    const docs = await getVersions({ payload, id: created.id })
    await payload.update({
      id: created.id,
      collection: versionedDynamicMediaSlug,
      data: { _transforms: { crop: laterCrop }, alt: 'Changed' },
    })
    const restored = await payload.restoreVersion({
      id: String(docs[0]!.id),
      collection: versionedDynamicMediaSlug,
      select: { alt: true },
      overrideAccess: true,
    })
    expect(restored.alt).toBe('English')
    expect(restored.filename).toBeUndefined()
    const versions = await getVersions({ payload, id: created.id })
    const latest = versions.find(({ latest }) => latest)!.version
    expect(latest).toMatchObject({
      alt: { en: 'English', es: 'Español' },
      _transforms: { crop: savedCrop },
    })
    expect(latest.filename).toBeTruthy()
    expect(latest.original.filename).toBeTruthy()
  })

  test('should persist transform state changed by the upload pipeline', async ({ payload }) => {
    const { selected } = await prepareHistory({ payload })
    const selectedSnapshot = structuredClone(selected.version)
    const transformer = payload.config.upload.transformers.find(
      ({ slug }) => slug === 'upload-crop',
    )!
    const transformFile = transformer.transformFile!
    vi.spyOn(transformer, 'transformFile').mockImplementation(async (args) => {
      expect(args.doc.alt).toEqual({ en: 'selected' })
      expect(args.originalDoc.alt).toEqual({ en: 'selected' })
      expect(Object.isFrozen(args.originalDoc)).toBe(true)
      const result = await transformFile(args)
      args.doc._transforms = { ...args.doc._transforms, replayed: true }
      return result
    })
    const restored = await payload.restoreVersion({
      id: String(selected.id),
      collection: versionedDynamicMediaSlug,
      context: { isUploadCropEnabled: true },
      overrideAccess: true,
    })
    expect(restored._transforms).toEqual({ crop: savedCrop, replayed: true })
    const versions = await getVersions({ payload, id: restored.id })
    expect(versions.find(({ id }) => id === selected.id)!.version).toEqual(selectedSnapshot)
    expect(versions.find(({ latest }) => latest)!.version._transforms).toEqual({
      crop: savedCrop,
      replayed: true,
    })
  })

  test('should keep caller upload bytes out of cloud restore hooks', async ({ payload }) => {
    const { selected } = await prepareHistory({ payload, collection: versionedCloudMediaSlug })
    const callerBytes = Buffer.from('not the retained original')
    const callerFile = {
      name: 'unrelated.png',
      data: callerBytes,
      mimetype: 'image/png',
      size: callerBytes.length,
    }
    const callerContext = {
      isUploadCropEnabled: true,
      _payloadCloudStorage: { file: callerFile },
      _payloadManagedCloudMetadata: { filename: 'unrelated.png' },
      _payloadManagedCloudStorage: true,
      _payloadVerifiedProviderOriginal: { key: 'unrelated-original' },
      skipCloudStorage: true,
    }
    const restored = await payload.restoreVersion({
      id: String(selected.id),
      collection: versionedCloudMediaSlug,
      context: callerContext,
      overrideAccess: true,
      req: {
        file: callerFile,
        query: { uploadEdits: { crop: { height: 10, width: 10, x: 0, y: 0 } } },
      },
    })
    expect(restored._transforms).toEqual({ crop: savedCrop })
    const storedDefault = getStoredCloudFiles(restored).find(({ roles }) =>
      roles.some(({ type }) => type === 'default'),
    )!
    expect(await sharp(versionedCloudFiles.get(storedDefault.key)!).metadata()).toMatchObject({
      height: 600,
      width: 800,
    })
    expect(callerContext._payloadCloudStorage.file).toBe(callerFile)
    expect(callerContext.skipCloudStorage).toBe(true)
    expect(callerContext._payloadManagedCloudStorage).toBe(true)
    expect(callerContext._payloadVerifiedProviderOriginal.key).toBe('unrelated-original')
  })

  test('should not store a copy of the retained original when an upload stage leaves the file unchanged', async ({
    payload,
  }) => {
    const { selected } = await prepareHistory({ payload })
    const filesBefore = new Set(await readdir(versionedDynamicMediaDir))
    const transformer = payload.config.upload.transformers.find(
      ({ slug }) => slug === 'upload-crop',
    )!
    vi.spyOn(transformer, 'transformFile').mockResolvedValue({ status: 'continue' })

    const restored = await payload.restoreVersion({
      id: String(selected.id),
      collection: versionedDynamicMediaSlug,
      context: { isUploadCropEnabled: true },
      overrideAccess: true,
    })

    expect(restored.filename).toBe(restored.original!.filename)
    expect(
      [...(await readdir(versionedDynamicMediaDir))].filter((name) => !filesBefore.has(name)),
    ).toEqual([])
  })

  test('should reject an upload stage crop that exceeds the retained original before storing output', async ({
    payload,
  }) => {
    const { selected } = await prepareHistory({ payload })
    const beforeFiles = (await readdir(versionedDynamicMediaDir)).sort()
    uploadCropSources.length = 0
    const transformer = payload.config.upload.transformers.find(
      ({ slug }) => slug === 'upload-crop',
    )!
    const transformFile = transformer.transformFile!
    vi.spyOn(transformer, 'transformFile').mockImplementation(async (args) => {
      const result = await transformFile(args)
      args.doc._transforms = { crop: { ...savedCrop, width: 9999 } }
      return result
    })
    await expect(
      payload.restoreVersion({
        id: String(selected.id),
        collection: versionedDynamicMediaSlug,
        context: { isUploadCropEnabled: true },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
    expect((await readdir(versionedDynamicMediaDir)).sort()).toEqual(beforeFiles)
    expect(uploadCropSources).toEqual([{ tempFilePath: expect.any(String) }])
    expect(existsSync(uploadCropSources[0]!.tempFilePath!)).toBe(false)
  })

  test('should preserve the selected stored main and original when replaying its virtual variants', async ({
    payload,
    restClient,
  }) => {
    const created = await payload.create({
      collection: versionedDynamicMediaSlug,
      data: { _transforms: { crop: savedCrop }, alt: 'selected stored' },
      context: { isUploadCropEnabled: true },
      filePath: imageFixture,
    })
    const docs = await getVersions({ payload, id: created.id })
    const selected = docs[0]!
    const selectedMain = await readFile(
      path.join(versionedDynamicMediaDir, selected.version.filename),
    )
    const selectedOriginal = structuredClone(selected.version.original)
    await payload.update({
      id: created.id,
      collection: versionedDynamicMediaSlug,
      data: { alt: 'current' },
    })
    await payload.restoreVersion({
      id: String(selected.id),
      collection: versionedDynamicMediaSlug,
      context: { isUploadCropEnabled: true },
      overrideAccess: true,
    })
    const after = await getVersions({ payload, id: created.id })
    const retained = after.find(({ id }) => id === selected.id)!.version
    expect(retained).toMatchObject({
      _transforms: { crop: savedCrop },
      alt: { en: 'selected stored' },
      original: selectedOriginal,
    })
    const response = await restClient.GET(
      `/${versionedDynamicMediaSlug}/file/${retained.filename}?version=${selected.id}`,
    )
    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(selectedMain)
  })

  test('should persist current adapter metadata when restoring a selected draft response', async ({
    payload,
  }) => {
    const { created, selected } = await prepareHistory({
      payload,
      collection: versionedCloudMediaSlug,
    })
    const currentBefore = await payload.db.findOne({
      collection: versionedCloudMediaSlug,
      where: { id: { equals: created.id } },
    })
    const restored = await payload.restoreVersion({
      id: String(selected.id),
      collection: versionedCloudMediaSlug,
      context: { isUploadCropEnabled: true },
      draft: true,
      select: { storageMarker: true },
      overrideAccess: true,
    })
    expect(restored.storageMarker).toBeTruthy()
    expect(restored.storageMarker).not.toBe(selected.version.storageMarker)
    expect(restored.filename).toBeUndefined()
    expect(restored._status).toBeUndefined()
    const currentAfter = await payload.db.findOne({
      collection: versionedCloudMediaSlug,
      where: { id: { equals: created.id } },
    })
    expect(currentAfter).toEqual(currentBefore)
    const versions = await getVersions({
      payload,
      id: created.id,
      collection: versionedCloudMediaSlug,
    })
    const latest = versions.find(({ latest }) => latest)!.version
    expect(latest).toMatchObject({
      storageMarker: restored.storageMarker,
      _transforms: { crop: savedCrop },
      _status: { en: 'draft' },
    })
    expect(latest.filename).toBeTruthy()
  })

  test.options(
    'should validate adapter metadata and roll back the restored files and document if it fails',
    { db: (adapter) => !adaptersWithoutTransactions.includes(adapter) },
    async ({ payload }) => {
      const { created, selected } = await prepareHistory({
        payload,
        collection: versionedCloudMediaSlug,
      })
      const currentBefore = await payload.db.findOne({
        collection: versionedCloudMediaSlug,
        where: { id: { equals: created.id } },
      })
      const filesBefore = new Map(versionedCloudFiles)
      const collection = payload.collections[versionedCloudMediaSlug].config
      const operations = collection.upload.fileOperations!
      const stage = operations.stage
      vi.spyOn(operations, 'stage').mockImplementation(async (args) => {
        const result = await stage(args)
        return { metadata: { ...result.metadata, storageMarker: 'invalid' } }
      })
      const field = collection.fields.find(
        (field) => 'name' in field && field.name === 'storageMarker',
      )!
      const validate = 'validate' in field ? field.validate : undefined
      try {
        Object.assign(field, {
          validate: (value: string) => (value === 'invalid' ? 'Invalid adapter metadata' : true),
        })
        await expect(
          payload.restoreVersion({
            id: String(selected.id),
            collection: versionedCloudMediaSlug,
            context: { isUploadCropEnabled: true },
            overrideAccess: true,
          }),
        ).rejects.toThrow()
        expect(versionedCloudFiles).toEqual(filesBefore)
        expect(
          await payload.db.findOne({
            collection: versionedCloudMediaSlug,
            where: { id: { equals: created.id } },
          }),
        ).toEqual(currentBefore)
      } finally {
        Object.assign(field, { validate })
      }
    },
  )

  test.options(
    'should retain a referenced restored file when adapter metadata fails without a transaction',
    { db: (adapter) => adaptersWithoutTransactions.includes(adapter) },
    async ({ payload }) => {
      const { created, selected } = await prepareHistory({
        payload,
        collection: versionedCloudMediaSlug,
      })
      const filesBefore = new Map(versionedCloudFiles)
      const collection = payload.collections[versionedCloudMediaSlug].config
      const operations = collection.upload.fileOperations!
      const stage = operations.stage
      vi.spyOn(operations, 'stage').mockImplementation(async (args) => {
        const result = await stage(args)
        return { metadata: { ...result.metadata, storageMarker: 'invalid' } }
      })
      const field = collection.fields.find(
        (field) => 'name' in field && field.name === 'storageMarker',
      )!
      const validate = 'validate' in field ? field.validate : undefined
      try {
        Object.assign(field, {
          validate: (value: string) => (value === 'invalid' ? 'Invalid adapter metadata' : true),
        })
        await expect(
          payload.restoreVersion({
            id: String(selected.id),
            collection: versionedCloudMediaSlug,
            context: { isUploadCropEnabled: true },
            overrideAccess: true,
          }),
        ).rejects.toThrow()
        const currentAfter = await payload.findByID({
          id: created.id,
          collection: versionedCloudMediaSlug,
          showHiddenFields: true,
        })
        expect(currentAfter._transforms).toEqual({ crop: savedCrop })
        expect(currentAfter.storageMarker).toBe(selected.version.storageMarker)
        const storedDefault = getStoredCloudFiles(currentAfter).find(({ roles }) =>
          roles.some(({ type }) => type === 'default'),
        )!
        expect(await sharp(versionedCloudFiles.get(storedDefault.key)!).metadata()).toMatchObject({
          height: 600,
          width: 800,
        })
        expect([...versionedCloudFiles.keys()].sort()).toEqual(
          [...filesBefore.keys(), storedDefault.key].sort(),
        )
        for (const [key, bytes] of filesBefore) {
          expect(versionedCloudFiles.get(key)).toEqual(bytes)
        }
        const versions = await getVersions({
          payload,
          id: created.id,
          collection: versionedCloudMediaSlug,
        })
        expect(versions.find(({ id }) => id === selected.id)!.version).toEqual(selected.version)
      } finally {
        Object.assign(field, { validate })
      }
    },
  )
})
