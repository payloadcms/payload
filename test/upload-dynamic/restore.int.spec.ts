import type { Payload } from 'payload'

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
  test.afterEach(async () => {
    vi.restoreAllMocks()
    sourceReadCalls.length = 0
    versionedCloudFiles.clear()
    await rm(versionedDynamicMediaDir, { force: true, recursive: true })
  })

  test('should keep a request-time version request-time on restore, with no new stored files', async ({
    payload,
  }) => {
    const { selected } = await prepareHistory({ payload })
    const filesBefore = (await readdir(versionedDynamicMediaDir)).sort()
    const restored = await payload.restoreVersion({
      id: String(selected.id),
      collection: versionedDynamicMediaSlug,
      // An upload stage that could apply the saved crop must not turn the restore into a rebuild.
      context: { isUploadCropEnabled: true },
      overrideAccess: true,
    })

    expect(restored._stored).toBe(false)
    expect(restored.variants?.card?._stored).toBe(false)
    expect(restored._transforms).toEqual({ crop: savedCrop })
    expect((await readdir(versionedDynamicMediaDir)).sort()).toEqual(filesBefore)
    expect(sourceReadCalls).toHaveLength(0)
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
