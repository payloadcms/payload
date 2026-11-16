import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  Payload,
  PayloadRequest,
  SanitizedCollectionConfig,
} from 'payload'

import { readdir, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { versionedCloudFiles } from '../plugin-cloud-storage/versionedCloudStorage.js'
import { sourceReadCalls } from './collections/DynamicMedia.js'
import {
  versionedCloudMediaSlug,
  versionedDynamicMediaDir,
  versionedDynamicMediaSlug,
} from './shared.js'

const imageFixture = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../uploads/image.png',
)
const savedCrop = { height: 600, width: 800, x: 100, y: 200 }
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
  test.afterEach(async ({ payload }) => {
    for (const [slug, variants] of removedVariants) {
      payload.collections[slug].config.upload.variants = variants
    }
    removedVariants.clear()
    vi.restoreAllMocks()
    sourceReadCalls.length = 0
    versionedCloudFiles.clear()
    await rm(versionedDynamicMediaDir, { force: true, recursive: true })
  })

  test('should keep a request-time version request-time on restore, with no new stored files', async ({
    payload,
    restClient,
  }) => {
    const { created, selected } = await prepareHistory({ payload })

    await payload.db.updateVersion({
      id: selected.id,
      collection: versionedDynamicMediaSlug,
      versionData: { version: { ...selected.version, alt: { en: 'selected', es: 'Español' } } },
    })
    const filesBefore = (await readdir(versionedDynamicMediaDir)).sort()
    const responseDoc = await payload.restoreVersion({
      id: String(selected.id),
      collection: versionedDynamicMediaSlug,
      // An upload stage that could apply the saved crop must not turn the restore into a rebuild.
      context: { isUploadCropEnabled: true },
      overrideAccess: true,
      select: { alt: true },
    })

    expect(responseDoc.alt).toBe('selected')
    expect(responseDoc.filename).toBeUndefined()

    const restored = await payload.db.findOne({
      collection: versionedDynamicMediaSlug,
      where: { id: { equals: created.id } },
    })

    expect(restored.alt).toEqual({ en: 'selected', es: 'Español' })
    expect(restored._stored).toBe(false)
    expect(restored.filename).toBe(restored.original?.filename)
    expect(restored.variants?.card?._stored).toBe(false)
    expect(restored._transforms).toEqual({ crop: savedCrop })
    expect((await readdir(versionedDynamicMediaDir)).sort()).toEqual(filesBefore)
    expect(sourceReadCalls).toHaveLength(0)

    const versions = await getVersions({ payload, id: created.id })
    const latest = versions.find(({ latest }) => latest)!.version

    expect(latest).toMatchObject({
      alt: { en: 'selected', es: 'Español' },
      filename: restored.filename,
      original: { filename: restored.original!.filename },
      _transforms: { crop: savedCrop },
    })

    const response = await restClient.GET(`/${versionedDynamicMediaSlug}/file/${restored.filename}`)

    expect(response.status).toBe(200)
    expect(await sharp(Buffer.from(await response.arrayBuffer())).metadata()).toMatchObject({
      height: savedCrop.height,
      width: savedCrop.width,
    })
  })

  test('should copy a replaced original on restore and build the version at request time', async ({
    payload,
    restClient,
  }) => {
    const { created, selected } = await prepareHistory({ payload, replaceOriginal: true })
    const before = structuredClone(selected.version)
    const filesBeforeRestore = new Set(await readdir(versionedDynamicMediaDir))
    const restored = await payload.restoreVersion({
      id: String(selected.id),
      collection: versionedDynamicMediaSlug,
      overrideAccess: true,
    })

    expect(restored._stored).toBe(false)
    expect(restored._transforms).toEqual({ crop: savedCrop })
    expect(
      await readFile(path.join(versionedDynamicMediaDir, restored.original!.filename!)),
    ).toEqual(await readFile(imageFixture))

    const versions = await getVersions({ payload, id: created.id })

    expect(versions.find(({ id }) => id === selected.id)!.version).toEqual(before)
    expect(restored.id).toBe(created.id)

    const latest = versions.find(({ latest }) => latest)!
    const response = await restClient.GET(
      `/${versionedDynamicMediaSlug}/file/${restored.filename}?version=${latest.id}`,
    )

    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(
      await sharp(await readFile(imageFixture))
        .extract({
          left: savedCrop.x,
          top: savedCrop.y,
          width: savedCrop.width,
          height: savedCrop.height,
        })
        .toBuffer(),
    )

    await payload.delete({ id: restored.id, collection: versionedDynamicMediaSlug, trash: false })
    const remainingFiles = await readdir(versionedDynamicMediaDir)

    expect(remainingFiles.filter((filename) => !filesBeforeRestore.has(filename))).toEqual([])
  })

  test('should fail with 400 and write nothing when the current config cannot build an entry and it has no stored output', async ({
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
    ).rejects.toMatchObject({ status: 400 })
    expect(await readdir(versionedDynamicMediaDir)).toEqual(beforeFiles)
    expect(
      await payload.db.findOne({
        collection: versionedDynamicMediaSlug,
        where: { id: { equals: created.id } },
      }),
    ).toEqual(before)
    expect(await getVersions({ payload, id: created.id })).toHaveLength(2)
    expect(sourceReadCalls).toHaveLength(0)
  })

  test('should leave out a size the version never had when the current config cannot build it at request time', async ({
    payload,
  }) => {
    const upload = payload.collections[versionedDynamicMediaSlug].config.upload
    const { variants, variantsTransformerSlug } = upload

    removedVariants.set(versionedDynamicMediaSlug, variants)
    upload.variants = []

    const { selected } = await prepareHistory({ payload })

    expect(selected.version.variants?.card?.filename).toBeFalsy()

    upload.variants = variants
    upload.variantsTransformerSlug = 'unavailable-variants'

    try {
      const restored = await payload.restoreVersion({
        id: String(selected.id),
        collection: versionedDynamicMediaSlug,
        overrideAccess: true,
      })

      expect(restored._stored).toBe(false)
      expect(restored._transforms).toEqual({ crop: savedCrop })
      expect(restored.variants?.card?.filename).toBeFalsy()
      expect(sourceReadCalls).toHaveLength(0)
    } finally {
      upload.variantsTransformerSlug = variantsTransformerSlug
    }
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

  test('should keep a stored main stored and its variants request-time on restore, with focal-only transforms', async ({
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

    expect(restored._stored).toBe(false)
    expect(restored._transforms).toEqual({ crop: savedCrop })
    expect(restored.filename).not.toBe('unrelated.png')
    expect([...versionedCloudFiles.values()]).not.toContainEqual(callerBytes)
    expect(callerContext._payloadCloudStorage.file).toBe(callerFile)
    expect(callerContext.skipCloudStorage).toBe(true)
    expect(callerContext._payloadManagedCloudStorage).toBe(true)
    expect(callerContext._payloadVerifiedProviderOriginal.key).toBe('unrelated-original')
  })

  test('should name a restored request-time variant apart from the stored main file', async ({
    payload,
    restClient,
  }) => {
    const transformer = payload.config.upload.transformers.find(
      ({ slug }) => slug === 'upload-crop',
    )!
    const transformFile = transformer.transformFile!.bind(transformer)

    // The stored main is named `<original>-card`, the name a `card` variant built from the
    // original would take.
    vi.spyOn(transformer, 'transformFile').mockImplementation(async (args) => {
      const result = await transformFile(args)

      return result.file
        ? {
            ...result,
            file: new File([await result.file.arrayBuffer()], 'image-card.png', {
              type: result.file.type,
            }),
          }
        : result
    })

    const created = await payload.create({
      collection: versionedCloudMediaSlug,
      context: { isUploadCropEnabled: true },
      data: { _transforms: { crop: savedCrop }, alt: 'selected' },
      filePath: imageFixture,
      overrideAccess: true,
    })

    expect(created.filename).toBe('image-card.png')
    expect(created.original?.filename).toBe('image.png')
    expect(created.variants?.card?._stored).toBe(false)

    const [selected] = await getVersions({
      payload,
      id: created.id,
      collection: versionedCloudMediaSlug,
    })

    await payload.update({
      id: created.id,
      collection: versionedCloudMediaSlug,
      data: { alt: 'current' },
    })

    const restored = await payload.restoreVersion({
      id: String(selected!.id),
      collection: versionedCloudMediaSlug,
      overrideAccess: true,
    })

    expect(restored.filename).toBe('image-card.png')
    expect(restored.variants?.card?._stored).toBe(false)
    expect(restored.variants?.card?.filename).not.toBe(restored.filename)
    expect(restored.variants?.card?.filename).not.toBe(restored.original?.filename)

    const response = await restClient.GET(
      `/${versionedCloudMediaSlug}/file/${restored.variants!.card!.filename}`,
    )

    expect(response.status).toBe(200)
    expect(await sharp(Buffer.from(await response.arrayBuffer())).metadata()).toMatchObject({
      width: 400,
    })
  })

  test('should not let a caller cloud storage context reach the restore and should keep the caller cloud keys after it', async ({
    payload,
  }) => {
    const { selected } = await prepareStoredOnlyHistory({
      payload,
      collection: versionedCloudMediaSlug,
    })
    const hooks = payload.collections[versionedCloudMediaSlug].config.hooks
    const seenKeys: string[][] = []
    const beforeChange: CollectionBeforeChangeHook = ({ data, req }) => {
      seenKeys.push(Object.keys(req.context).filter((key) => key in callerCloudContext))
      return data
    }
    const afterChange: CollectionAfterChangeHook = ({ req }) => {
      seenKeys.push(Object.keys(req.context).filter((key) => key in callerCloudContext))
      req.context.restoreHookMarker = 'set by afterChange'
    }
    const callerCloudContext = {
      _payloadManagedCloudMetadata: { filename: 'unrelated.png' },
      _payloadManagedCloudStorage: true,
      _payloadVerifiedProviderOriginal: { key: 'unrelated-original' },
      skipCloudStorage: true,
    }
    const req: Partial<PayloadRequest> = { context: { ...callerCloudContext } }

    hooks.beforeChange.push(beforeChange)
    hooks.afterChange.push(afterChange)

    try {
      await payload.restoreVersion({
        id: String(selected.id),
        collection: versionedCloudMediaSlug,
        overrideAccess: true,
        req,
      })
    } finally {
      hooks.beforeChange.splice(hooks.beforeChange.indexOf(beforeChange), 1)
      hooks.afterChange.splice(hooks.afterChange.indexOf(afterChange), 1)
    }

    expect(seenKeys).toEqual([[], []])
    expect(req.context).toMatchObject({
      ...callerCloudContext,
      restoreHookMarker: 'set by afterChange',
    })
  })

  test('should put back the caller cloud storage context when the restore fails', async ({
    payload,
  }) => {
    const { selected } = await prepareStoredOnlyHistory({
      payload,
      collection: versionedCloudMediaSlug,
    })
    const hooks = payload.collections[versionedCloudMediaSlug].config.hooks
    const afterChange: CollectionAfterChangeHook = () => {
      throw new Error('afterChange failed')
    }
    const callerCloudContext = {
      _payloadManagedCloudMetadata: { filename: 'unrelated.png' },
      _payloadManagedCloudStorage: true,
    }
    const req: Partial<PayloadRequest> = { context: { ...callerCloudContext } }

    hooks.afterChange.push(afterChange)

    try {
      await expect(
        payload.restoreVersion({
          id: String(selected.id),
          collection: versionedCloudMediaSlug,
          overrideAccess: true,
          req,
        }),
      ).rejects.toThrow('afterChange failed')
    } finally {
      hooks.afterChange.splice(hooks.afterChange.indexOf(afterChange), 1)
    }

    expect(req.context).toMatchObject(callerCloudContext)
  })

  test('should keep stored entries stored and request-time entries request-time when restoring a mixed version', async ({
    payload,
    restClient,
  }) => {
    const { created, selected, selectedMain } = await prepareMixedHistory({ payload })
    const restored = await payload.restoreVersion({
      id: String(selected.id),
      collection: versionedDynamicMediaSlug,
      overrideAccess: true,
    })

    expect(restored._stored).not.toBe(false)
    expect(restored).toMatchObject({ height: 600, width: 800 })
    expect(await readFile(path.join(versionedDynamicMediaDir, restored.filename!))).toEqual(
      selectedMain,
    )
    expect(restored.variants?.card?._stored).toBe(false)

    const after = await getVersions({ payload, id: created.id })
    const retained = after.find(({ id }) => id === selected.id)!.version

    expect(retained).toMatchObject({
      _transforms: { crop: savedCrop },
      alt: { en: 'selected stored' },
      original: selected.version.original,
    })

    const response = await restClient.GET(
      `/${versionedDynamicMediaSlug}/file/${retained.filename}?version=${selected.id}`,
    )

    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(selectedMain)
  })

  test('should keep the old stored output on restore when the current config cannot build that entry at request time', async ({
    payload,
  }) => {
    const { selected, selectedMain } = await prepareMixedHistory({ payload })
    const transformer = payload.config.upload.transformers.find(
      ({ slug }) => slug === 'request-crop',
    )!
    const upload = payload.collections[versionedDynamicMediaSlug].config.upload
    const variants = upload.variants

    vi.spyOn(transformer, 'canTransform').mockReturnValue(false)

    try {
      upload.variants = []

      const restored = await payload.restoreVersion({
        id: String(selected.id),
        collection: versionedDynamicMediaSlug,
        overrideAccess: true,
      })

      expect(restored._stored).not.toBe(false)
      expect(await readFile(path.join(versionedDynamicMediaDir, restored.filename!))).toEqual(
        selectedMain,
      )
      expect(restored.variants?.card?.filename).toBeFalsy()
    } finally {
      upload.variants = variants
    }
  })

  test('should fail with 400 and write nothing when the current config cannot build a request-time variant of a stored main', async ({
    payload,
  }) => {
    const { created, selected } = await prepareMixedHistory({ payload })
    const transformer = payload.config.upload.transformers.find(
      ({ slug }) => slug === 'request-crop',
    )!
    const filesBefore = (await readdir(versionedDynamicMediaDir)).sort()
    const docBefore = await payload.db.findOne({
      collection: versionedDynamicMediaSlug,
      where: { id: { equals: created.id } },
    })
    const versionsBefore = await getVersions({ payload, id: created.id })

    vi.spyOn(transformer, 'canTransform').mockReturnValue(false)

    await expect(
      payload.restoreVersion({
        id: String(selected.id),
        collection: versionedDynamicMediaSlug,
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({
      message: 'No compatible transformer can restore the configured file variants.',
      status: 400,
    })
    expect((await readdir(versionedDynamicMediaDir)).sort()).toEqual(filesBefore)
    expect(
      await payload.db.findOne({
        collection: versionedDynamicMediaSlug,
        where: { id: { equals: created.id } },
      }),
    ).toEqual(docBefore)
    expect(await getVersions({ payload, id: created.id })).toEqual(versionsBefore)
    expect(sourceReadCalls).toHaveLength(0)
  })

  test('should save the full upload data as a new draft when a draft restore selects one field', async ({
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
      draft: true,
      select: { storageMarker: true },
      overrideAccess: true,
    })

    expect(restored.filename).toBeUndefined()
    expect(restored._status).toBeUndefined()
    expect(
      await payload.db.findOne({
        collection: versionedCloudMediaSlug,
        where: { id: { equals: created.id } },
      }),
    ).toEqual(currentBefore)

    const versions = await getVersions({
      payload,
      id: created.id,
      collection: versionedCloudMediaSlug,
    })
    const latest = versions.find(({ latest }) => latest)!.version

    expect(latest).toMatchObject({
      _status: { en: 'draft' },
      _stored: false,
      _transforms: { crop: savedCrop },
    })
    expect(latest.filename).toBeTruthy()
  })
})

type VersionedSlug = typeof versionedCloudMediaSlug | typeof versionedDynamicMediaSlug

/** Variants a test removed from a collection, put back after each test. */
const removedVariants = new Map<VersionedSlug, SanitizedCollectionConfig['upload']['variants']>()

/**
 * A version with only stored files. The collection declares no variants until the test ends, so
 * the restore copies stored files and builds nothing at request time.
 */
async function prepareStoredOnlyHistory({
  payload,
  collection = versionedDynamicMediaSlug,
}: {
  collection?: VersionedSlug
  payload: Payload
}) {
  const upload = payload.collections[collection].config.upload

  removedVariants.set(collection, upload.variants)
  upload.variants = []

  const created = await payload.create({
    collection,
    data: { alt: 'selected' },
    filePath: imageFixture,
  })
  const [selected] = await getVersions({ payload, id: created.id, collection })

  expect(selected!.version._stored).not.toBe(false)

  await payload.update({ id: created.id, collection, data: { alt: 'current' } })

  return { created, selected: selected! }
}

/** A version whose main file was stored by an upload stage and whose `card` size is request-time. */
async function prepareMixedHistory({ payload }: { payload: Payload }) {
  const created = await payload.create({
    collection: versionedDynamicMediaSlug,
    data: { _transforms: { crop: savedCrop }, alt: 'selected stored' },
    context: { isUploadCropEnabled: true },
    filePath: imageFixture,
  })
  const [selected] = await getVersions({ payload, id: created.id })

  expect(selected!.version._stored).not.toBe(false)
  expect(selected!.version.variants.card._stored).toBe(false)

  const selectedMain = await readFile(
    path.join(versionedDynamicMediaDir, selected!.version.filename),
  )

  await payload.update({
    id: created.id,
    collection: versionedDynamicMediaSlug,
    data: { _transforms: { crop: laterCrop }, alt: 'current' },
  })
  sourceReadCalls.length = 0

  return { created, selected: selected!, selectedMain }
}
