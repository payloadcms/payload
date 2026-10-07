/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Tests use the shared fixture wrapper. */
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPayloadRequest } from 'payload'
import sharp from 'sharp'
import { expect, vi } from 'vitest'

/* eslint-disable payload/no-relative-monorepo-imports -- These lifecycle helpers are internal. */
import {
  collectVersionFiles,
  scheduleUnreferencedFileCleanup,
} from '../../packages/payload/src/uploads/fileVersioning/cleanup.js'
import { initTransaction } from '../../packages/payload/src/utilities/initTransaction.js'
import { killTransaction } from '../../packages/payload/src/utilities/killTransaction.js'
/* eslint-enable payload/no-relative-monorepo-imports */
import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import {
  convertedMediaDir,
  convertedMediaSlug,
  draftMediaDir,
  draftMediaSlug,
  mediaDir,
  mediaSlug,
  plainMediaDir,
  plainMediaSlug,
  transformedMediaDir,
  transformedMediaSlug,
  trashMediaDir,
  trashMediaSlug,
} from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const imageFixture = path.resolve(dirname, '../uploads/image.png')
const pdfFixture = path.resolve(dirname, '../uploads/image-as-pdf.pdf')
const videoFixture = path.resolve(dirname, '../uploads/christmas-mariachi-in-guadalajara.mp4')
const isTransactionalMongoAdapter = (adapter: string) =>
  adapter === 'mongodb' || adapter === 'mongodb-atlas'

const original = {
  filename: 'photo-original.jpg',
  filesize: 123,
  height: 50,
  mimeType: 'image/jpeg',
  url: '/api/file-versioned-media/file/photo-original.jpg',
  width: 100,
}

const storedFilenames = (doc: {
  filename?: null | string
  original?: { filename?: null | string } | null
  variants?: null | Record<string, { filename?: null | string } | null>
}): string[] =>
  [
    doc.filename,
    doc.original?.filename,
    ...Object.values(doc.variants ?? {}).map((size) => size?.filename),
  ].filter((filename): filename is string => typeof filename === 'string')

test.suite('File versioning fields', { config: './config.ts' }, () => {
  test.afterEach(async () => {
    await rm(mediaDir, { force: true, recursive: true })
    await rm(draftMediaDir, { force: true, recursive: true })
    await rm(transformedMediaDir, { force: true, recursive: true })
    await rm(convertedMediaDir, { force: true, recursive: true })
    await rm(trashMediaDir, { force: true, recursive: true })
  })

  test('should ignore client supplied original data', async ({ payload }) => {
    const created = await payload.create({
      collection: mediaSlug,
      data: {
        alt: 'client data',
        original,
      } as never,
    })

    const internal = await payload.findByID({
      id: created.id,
      collection: mediaSlug,
      showHiddenFields: true,
    })

    expect(internal.original?.filename).toBeFalsy()
    expect(internal.original?.url).toBeFalsy()
    expect(internal.original?.mimeType).toBeFalsy()
    expect(internal.original?.filesize).toBeFalsy()
  })

  test('should retain an untouched server upload as one original and default object', async ({
    payload,
  }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: mediaSlug,
      data: { alt: 'uploaded' },
      file: { name: 'photo-1.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const stored = await payload.findByID({
      id: created.id,
      collection: mediaSlug,
      showHiddenFields: true,
    })
    const persisted = await payload.db.findOne({
      collection: mediaSlug,
      where: { id: { equals: created.id } },
    })

    expect(created.filename).toBe('photo-1-original.png')
    expect(stored.original).toMatchObject({
      filename: 'photo-1-original.png',
      filesize: bytes.length,
      mimeType: 'image/png',
    })
    expect(created.original?.url).toBe(created.url)
    expect(new URL(created.original!.url!, 'http://localhost').searchParams.has('original')).toBe(
      false,
    )
    expect(stored.filename).toBe(stored.original?.filename)
    expect(persisted?.original).toMatchObject(stored.original!)
    const { docs: versions } = await payload.db.findVersions({
      collection: mediaSlug,
      where: { parent: { equals: created.id } },
    })

    expect(versions[0]?.version.original).toMatchObject(persisted?.original)
    expect(versions[0]?.version.filename).toBe(persisted?.filename)
    expect(await readdir(mediaDir)).toEqual(['photo-1-original.png'])
    expect(await readFile(path.join(mediaDir, created.filename!))).toEqual(bytes)
  })

  test('should expose the original without a separate file inventory in read APIs', async ({
    payload,
    restClient,
  }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: mediaSlug,
      data: { alt: 'read APIs' },
      file: { name: 'read-api.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })

    const local = await payload.findByID({ id: created.id, collection: mediaSlug })
    const restResponse = await restClient.GET(`/${mediaSlug}/${created.id}`)
    const rest = (await restResponse.json()) as typeof local
    const graphqlResponse = await restClient.GRAPHQL_POST({
      body: JSON.stringify({
        query: `query { FileVersionedMedia(id: ${JSON.stringify(created.id)}) { original { filename url } } }`,
      }),
    })
    const graphql = (await graphqlResponse.json()) as {
      data?: { FileVersionedMedia: { original: { filename: string; url: string } } }
      errors?: { message: string }[]
    }

    expect(restResponse.status).toBe(200)
    expect(graphql.errors).toBeUndefined()
    expect(local.original?.filename).toBe(created.filename)
    expect(rest.original).toEqual(local.original)
    expect(graphql.data?.FileVersionedMedia.original).toMatchObject({
      filename: local.original?.filename,
      url: local.original?.url,
    })
    expect('_managedFiles' in local).toBe(false)
    expect('_managedFiles' in rest).toBe(false)
  })

  test('should retain PDFs and videos without duplicating their source object', async ({
    payload,
  }) => {
    for (const [fixture, mimetype, name, expectedFilename] of [
      [pdfFixture, 'application/pdf', 'document.pdf', 'document-original.pdf'],
      [videoFixture, 'video/mp4', 'clip.mp4', 'clip-original.mp4'],
    ]) {
      const bytes = await readFile(fixture)
      const created = await payload.create({
        collection: mediaSlug,
        data: { alt: name },
        file: { name, data: bytes, mimetype, size: bytes.length },
      })
      const stored = await payload.db.findOne({
        collection: mediaSlug,
        where: { id: { equals: created.id } },
      })

      expect(stored?.filename).toBe(expectedFilename)
      expect(stored?.original?.filename).toBe(stored?.filename)
      expect(await readFile(path.join(mediaDir, stored!.filename))).toEqual(bytes)
    }
  })

  test('should leave stored objects unchanged on a metadata-only update', async ({ payload }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: mediaSlug,
      data: { alt: 'before' },
      file: { name: 'metadata.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const filePath = path.join(mediaDir, created.filename!)
    const filesBefore = await readdir(mediaDir)
    const modifiedBefore = (await stat(filePath)).mtimeMs
    const before = await payload.db.findOne({
      collection: mediaSlug,
      where: { id: { equals: created.id } },
    })

    await payload.update({ id: created.id, collection: mediaSlug, data: { alt: 'after' } })

    const after = await payload.db.findOne({
      collection: mediaSlug,
      where: { id: { equals: created.id } },
    })

    expect(await readdir(mediaDir)).toEqual(filesBefore)
    expect((await stat(filePath)).mtimeMs).toBe(modifiedBefore)
    expect(await readFile(filePath)).toEqual(bytes)
    expect(after?.original).toEqual(before?.original)
    expect(after?.filename).toBe(before?.filename)
  })

  test('should give a duplicated upload independent managed objects', async ({ payload }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: mediaSlug,
      data: { alt: 'source' },
      file: { name: 'duplicate.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const duplicate = await payload.create({
      collection: mediaSlug,
      data: { alt: 'copy' },
      duplicateFromID: created.id,
    })
    const copied = await payload.db.findOne({
      collection: mediaSlug,
      where: { id: { equals: duplicate.id } },
    })

    expect(copied?.filename).not.toBe(created.filename)
    expect(await readFile(path.join(mediaDir, duplicate.filename!))).toEqual(bytes)
    expect(await readFile(path.join(mediaDir, created.filename!))).toEqual(bytes)
  })

  test('should retain a server-staged upload as the saved original', async ({
    payload,
    restClient,
  }) => {
    await restClient.login({ slug: 'users', credentials: devUser })

    const bytes = await readFile(imageFixture)
    const instructionsResponse = await restClient.POST('/upload-instructions', {
      body: JSON.stringify({
        collectionSlug: mediaSlug,
        filename: 'staged.png',
        filesize: bytes.length,
        mimeType: 'image/png',
      }),
    })
    const instructions = await instructionsResponse.json<{
      file: Record<string, unknown>
      request: { headers: Record<string, string>; url: string }
      type: string
    }>()

    expect(instructionsResponse.status).toBe(200)
    expect(instructions.type).toBe('http')

    const uploadPath = new URL(instructions.request.url, restClient.serverURL).pathname.replace(
      payload.config.routes.api,
      '',
    ) as `/${string}`
    const uploaded = await restClient.PUT(uploadPath, {
      body: bytes,
      headers: instructions.request.headers,
    })

    expect(uploaded.status).toBe(204)

    const formData = new FormData()
    formData.append('_payload', JSON.stringify({ alt: 'staged' }))
    formData.append('file', JSON.stringify(instructions.file))
    const response = await restClient.POST(`/${mediaSlug}`, { body: formData })
    const { doc } = await response.json()

    expect(response.status).toBe(201)

    const stored = await payload.db.findOne({
      collection: mediaSlug,
      where: { id: { equals: doc.id } },
    })

    expect(stored?.original?.filename).toBe(stored?.filename)
    expect(stored?.filename).toBe(stored?.original?.filename)
    expect(await readFile(path.join(mediaDir, stored!.filename))).toEqual(bytes)
  })

  test.options(
    'should compensate staged objects when a later hook rejects the upload',
    { db: isTransactionalMongoAdapter },
    async ({ payload }) => {
      const bytes = await readFile(imageFixture)
      const filesBefore = await readdir(mediaDir).catch(() => [] as string[])

      await expect(
        payload.create({
          collection: mediaSlug,
          data: { alt: 'reject-after-write' },
          file: { name: 'rollback.png', data: bytes, mimetype: 'image/png', size: bytes.length },
        }),
      ).rejects.toThrow('Rejected after the file and document write')

      expect(await readdir(mediaDir)).toEqual(filesBefore)
      const { totalDocs } = await payload.find({
        collection: mediaSlug,
        where: { alt: { equals: 'reject-after-write' } },
      })
      expect(totalDocs).toBe(0)
    },
  )

  test.options(
    'should retain the file if a hook fails after a nontransactional write',
    { db: (adapter) => adapter === 'sqlite' },
    async ({ payload }) => {
      const bytes = await readFile(imageFixture)

      await expect(
        payload.create({
          collection: mediaSlug,
          data: { alt: 'reject-after-write' },
          file: {
            name: 'nontransactional.png',
            data: bytes,
            mimetype: 'image/png',
            size: bytes.length,
          },
        }),
      ).rejects.toThrow('Rejected after the file and document write')

      const { docs } = await payload.find({
        collection: mediaSlug,
        where: { alt: { equals: 'reject-after-write' } },
      })

      expect(docs).toHaveLength(1)
      expect(await readFile(path.join(mediaDir, docs[0]!.filename!))).toEqual(bytes)
    },
  )

  test('should keep cropped main and configured size separate from the retained source', async ({
    payload,
    restClient,
  }) => {
    const bytes = await readFile(imageFixture)
    expect(payload.collections[transformedMediaSlug]?.config.upload.variants).toHaveLength(1)
    const created = await payload.create({
      collection: transformedMediaSlug,
      data: { alt: 'source' },
      file: { name: 'landscape.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const originalSizePixels = await sharp(
      path.join(transformedMediaDir, created.variants!.small!.filename!),
    )
      .raw()
      .toBuffer()

    const response = await restClient.PATCH(`/${transformedMediaSlug}/${created.id}`, {
      body: JSON.stringify({ alt: 'cropped' }),
      query: {
        uploadEdits: {
          crop: { height: 50, unit: '%', width: 50, x: 0, y: 0 },
          heightInPixels: 800,
          widthInPixels: 800,
        },
      },
    })
    const { doc } = await response.json()

    expect(response.status).toBe(200)

    const stored = await payload.db.findOne({
      collection: transformedMediaSlug,
      where: { id: { equals: doc.id } },
    })
    expect(stored?.variants?.small?.filename).toBeTruthy()
    expect(doc).toMatchObject({ height: 800, width: 800 })

    expect(stored?.original).toMatchObject({
      filesize: bytes.length,
      height: 1600,
      mimeType: 'image/png',
      width: 1600,
    })
    expect(stored?.original?.filename).not.toBe(stored?.filename)
    expect(
      new Set([stored?.filename, stored?.original?.filename, stored?.variants?.small?.filename])
        .size,
    ).toBe(3)
    expect(await readFile(path.join(transformedMediaDir, stored!.original!.filename))).toEqual(
      bytes,
    )
    await expect(
      sharp(path.join(transformedMediaDir, stored!.filename)).metadata(),
    ).resolves.toMatchObject({
      height: 800,
      width: 800,
    })
    await expect(
      sharp(path.join(transformedMediaDir, stored!.variants.small.filename)).metadata(),
    ).resolves.toMatchObject({ height: 200, width: 200 })
    expect(
      await sharp(path.join(transformedMediaDir, stored!.variants.small.filename)).raw().toBuffer(),
    ).toEqual(originalSizePixels)
  })

  test('should reset a saved crop to the retained original without copying its bytes', async ({
    payload,
    restClient,
  }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: transformedMediaSlug,
      data: { alt: 'source' },
      file: { name: 'landscape.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const crop = await restClient.PATCH(`/${transformedMediaSlug}/${created.id}`, {
      body: JSON.stringify({ alt: 'cropped' }),
      query: {
        uploadEdits: {
          crop: { height: 50, unit: '%', width: 50, x: 0, y: 0 },
          heightInPixels: 800,
          widthInPixels: 800,
        },
      },
    })
    expect(crop.status).toBe(200)
    const cropped = (await crop.json()).doc as typeof created

    const reset = await restClient.PATCH(`/${transformedMediaSlug}/${created.id}`, {
      body: JSON.stringify({ alt: 'reset' }),
      query: {
        uploadEdits: {
          crop: { height: 100, unit: '%', width: 100, x: 0, y: 0 },
          heightInPixels: 1600,
          widthInPixels: 1600,
        },
      },
    })
    expect(reset.status).toBe(200)
    const resetDoc = (await reset.json()).doc as typeof created
    const current = await payload.findByID({
      id: created.id,
      collection: transformedMediaSlug,
      showHiddenFields: true,
    })

    expect(resetDoc.filename).toBe(created.original!.filename)
    expect(resetDoc.url).toBe(created.original!.url)
    expect(current.filename).toBe(current.original?.filename)
    expect(await readFile(path.join(transformedMediaDir, resetDoc.filename!))).toEqual(bytes)
    expect(current.variants?.small?.filename).toBe(cropped.variants?.small?.filename)

    const { docs: versions } = await payload.db.findVersions({
      collection: transformedMediaSlug,
      where: { parent: { equals: created.id } },
    })
    const savedCrop = versions.find(({ version }) => version.alt === 'cropped')
    expect(savedCrop).toBeDefined()
    const savedCropKey = savedCrop?.version.filename
    expect(savedCropKey).toBeTruthy()
    await expect(
      sharp(path.join(transformedMediaDir, savedCropKey)).metadata(),
    ).resolves.toMatchObject({
      height: 800,
      width: 800,
    })
  })

  test('should reuse the original main file when resetting a crop and moving the focal point', async ({
    payload,
    restClient,
  }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: transformedMediaSlug,
      data: { alt: 'source' },
      file: { name: 'landscape.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const crop = await restClient.PATCH(`/${transformedMediaSlug}/${created.id}`, {
      body: JSON.stringify({ alt: 'cropped' }),
      query: {
        uploadEdits: {
          crop: { height: 50, unit: '%', width: 50, x: 0, y: 0 },
          heightInPixels: 800,
          widthInPixels: 800,
        },
      },
    })
    expect(crop.status).toBe(200)
    const cropped = (await crop.json()).doc as typeof created

    const reset = await restClient.PATCH(`/${transformedMediaSlug}/${created.id}`, {
      body: JSON.stringify({ alt: 'reset', focalX: 75, focalY: 25 }),
      query: {
        uploadEdits: {
          crop: { height: 100, unit: '%', width: 100, x: 0, y: 0 },
          heightInPixels: 1600,
          widthInPixels: 1600,
        },
      },
    })
    expect(reset.status).toBe(200)
    const resetDoc = (await reset.json()).doc as typeof created
    const current = await payload.findByID({
      id: created.id,
      collection: transformedMediaSlug,
      showHiddenFields: true,
    })

    expect(resetDoc.filename).toBe(created.original!.filename)
    expect(resetDoc.url).toBe(created.original!.url)
    expect(current.focalX).toBe(75)
    expect(current.focalY).toBe(25)
    expect(current.variants?.small?.filename).not.toBe(cropped.variants?.small?.filename)
    expect(current.filename).toBe(current.original?.filename)
    expect(await readFile(path.join(transformedMediaDir, resetDoc.filename!))).toEqual(bytes)
  })

  test('should keep the uploaded original after repeated edits and version pruning', async ({
    payload,
    restClient,
  }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: transformedMediaSlug,
      data: { alt: 'source' },
      file: { name: 'landscape.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const initialOriginal = created.original

    for (const [alt, x] of [
      ['first crop', 0],
      ['second crop', 25],
    ] as const) {
      const response = await restClient.PATCH(`/${transformedMediaSlug}/${created.id}`, {
        body: JSON.stringify({ alt }),
        query: {
          uploadEdits: {
            crop: { height: 50, unit: '%', width: 50, x, y: 0 },
            heightInPixels: 800,
            widthInPixels: 800,
          },
        },
      })

      expect(response.status).toBe(200)
    }

    const { docs: versions } = await payload.db.findVersions({
      collection: transformedMediaSlug,
      limit: 10,
      where: { parent: { equals: created.id } },
    })
    expect(versions).toHaveLength(2)

    const current = await payload.findByID({
      id: created.id,
      collection: transformedMediaSlug,
      showHiddenFields: true,
    })
    expect(current.original).toMatchObject(initialOriginal!)
    expect(await readFile(path.join(transformedMediaDir, current.original!.filename))).toEqual(
      bytes,
    )

    const originalResponse = await restClient.GET(
      `/${transformedMediaSlug}/file/${current.original!.filename}`,
    )
    expect(originalResponse.status).toBe(200)
    expect(Buffer.from(await originalResponse.arrayBuffer())).toEqual(bytes)
  })

  test('should retain trusted original data in a version snapshot', async ({ payload }) => {
    const created = await payload.db.create({
      collection: mediaSlug,
      data: {
        alt: 'stored data',
        original: structuredClone(original),
      },
    })

    const updated = await payload.update({
      id: created.id,
      collection: mediaSlug,
      data: {
        alt: 'changed metadata',
        original: { ...original, filename: 'forged.jpg' },
      } as never,
    })

    expect(updated.original).toMatchObject(original)

    const internal = await payload.findByID({
      id: created.id,
      collection: mediaSlug,
      showHiddenFields: true,
    })

    expect(internal.original).toMatchObject(original)

    const { docs: versions } = await payload.db.findVersions({
      collection: mediaSlug,
      where: { parent: { equals: created.id } },
    })

    expect(versions[0]?.version.original).toMatchObject(original)
  })

  test('should archive an outgoing original for every version that shares it', async ({
    payload,
  }) => {
    const firstBytes = await readFile(imageFixture)
    const secondBytes = await sharp(firstBytes).flop().png().toBuffer()
    const first = await payload.create({
      collection: mediaSlug,
      data: { alt: 'first' },
      file: { name: 'photo.png', data: firstBytes, mimetype: 'image/png', size: firstBytes.length },
    })

    await payload.update({ id: first.id, collection: mediaSlug, data: { alt: 'metadata only' } })
    const { docs: versionsBeforeReplacement } = await payload.db.findVersions({
      collection: mediaSlug,
      pagination: false,
      where: { parent: { equals: first.id } },
    })

    await payload.update({
      id: first.id,
      collection: mediaSlug,
      data: { alt: 'second' },
      file: {
        name: 'photo.png',
        data: secondBytes,
        mimetype: 'image/png',
        size: secondBytes.length,
      },
    })

    const { docs: versions } = await payload.db.findVersions({
      collection: mediaSlug,
      pagination: false,
      where: { parent: { equals: first.id } },
    })
    const olderVersions = versions.filter(({ version }) => version.alt !== 'second')
    const archivedNames = olderVersions.map(({ version }) => version.original?.filename)

    expect(olderVersions).toHaveLength(2)
    expect(new Set(archivedNames).size).toBe(1)
    expect(archivedNames[0]).not.toBe(first.filename)

    for (const { id, createdAt, updatedAt, version } of olderVersions) {
      const archivedName = version.original!.filename!
      const before = versionsBeforeReplacement.find((row) => row.id === id)

      expect(before).toBeDefined()
      expect(createdAt).toBe(before?.createdAt)
      expect(updatedAt).toBe(before?.updatedAt)
      expect(version.filename).toBe(archivedName)
      expect(version.original?.url).toContain(encodeURIComponent(archivedName))
      expect(version.original?.filename).toBe(version.filename)
      expect(await readFile(path.join(mediaDir, archivedName))).toEqual(firstBytes)
    }
  })

  test('should create a readable baseline when a legacy file is first replaced', async ({
    payload,
  }) => {
    const firstBytes = await readFile(imageFixture)
    const secondBytes = await sharp(firstBytes).flop().png().toBuffer()
    await mkdir(mediaDir, { recursive: true })
    await writeFile(path.join(mediaDir, 'legacy.png'), firstBytes)
    const legacy = await payload.db.create({
      collection: mediaSlug,
      data: {
        alt: 'legacy',
        filename: 'legacy.png',
        filesize: firstBytes.length,
        mimeType: 'image/png',
        url: `/api/${mediaSlug}/file/legacy.png`,
      },
    })

    await payload.update({
      id: legacy.id,
      collection: mediaSlug,
      data: { alt: 'replacement' },
      file: { name: 'new.png', data: secondBytes, mimetype: 'image/png', size: secondBytes.length },
    })

    const { docs: versions } = await payload.db.findVersions({
      collection: mediaSlug,
      limit: 0,
      pagination: false,
      where: { parent: { equals: legacy.id } },
    })
    const baseline = versions.find(({ version }) => version.alt === 'legacy')

    expect(baseline).toBeDefined()
    expect(baseline?.version.original?.filename).toBeTruthy()
    expect(baseline?.version.filename).toBe(baseline?.version.original?.filename)
    expect(await readFile(path.join(mediaDir, baseline!.version.original!.filename))).toEqual(
      firstBytes,
    )
  })

  test('should return 404 without reading unrelated history for an unmatched public filename', async ({
    payload,
    restClient,
  }) => {
    const created = await payload.create({
      collection: transformedMediaSlug,
      data: { alt: 'unrelated history' },
      filePath: imageFixture,
    })
    const { docs } = await payload.db.findVersions({
      collection: transformedMediaSlug,
      where: { parent: { equals: created.id } },
    })
    const now = new Date().toISOString()

    for (let batch = 0; batch < 5; batch++) {
      await Promise.all(
        Array.from({ length: 25 }, () =>
          payload.db.createVersion({
            autosave: false,
            collectionSlug: transformedMediaSlug,
            createdAt: now,
            parent: created.id,
            updatedAt: now,
            versionData: docs[0]!.version,
          }),
        ),
      )
    }

    const historySpy = vi.spyOn(payload.db, 'findVersions')
    const transformers = payload.config.upload.transformers

    try {
      for (const hasTransformers of [true, false]) {
        payload.config.upload.transformers = hasTransformers ? transformers : []
        historySpy.mockClear()
        const response = await restClient.GET(
          `/${transformedMediaSlug}/file/not-a-saved-file.png`,
          {
            auth: false,
          },
        )

        expect(response.status).toBe(404)
        expect(historySpy).not.toHaveBeenCalled()
      }
    } finally {
      payload.config.upload.transformers = transformers
      historySpy.mockRestore()
    }
  })

  test('should restore saved original and output bytes without changing the selected version', async ({
    payload,
    restClient,
  }) => {
    const firstBytes = await readFile(imageFixture)
    const secondBytes = await sharp(firstBytes).flop().png().toBuffer()
    const created = await payload.create({
      collection: mediaSlug,
      data: { alt: 'A' },
      file: {
        name: 'restore.png',
        data: firstBytes,
        mimetype: 'image/png',
        size: firstBytes.length,
      },
    })

    await payload.update({
      id: created.id,
      collection: mediaSlug,
      data: { alt: 'B' },
      file: {
        name: 'restore.png',
        data: secondBytes,
        mimetype: 'image/png',
        size: secondBytes.length,
      },
    })

    const { docs: before } = await payload.db.findVersions({
      collection: mediaSlug,
      pagination: false,
      where: { parent: { equals: created.id } },
    })
    const selected = before.find(({ version }) => version.alt === 'A')!
    const historicalResponse = await restClient.GET(
      `/${mediaSlug}/file/${selected.version.original!.filename}?version=${selected.id}`,
    )

    expect(historicalResponse.status).toBe(200)
    expect(Buffer.from(await historicalResponse.arrayBuffer()).equals(firstBytes)).toBe(true)

    const bareResponse = await restClient.GET(
      `/${mediaSlug}/file/${selected.version.original!.filename}`,
    )
    const other = await payload.create({
      collection: mediaSlug,
      data: { alt: 'another document' },
      filePath: imageFixture,
    })
    const wrongFileResponse = await restClient.GET(
      `/${mediaSlug}/file/${other.filename}?version=${selected.id}`,
    )
    const missingVersionID = isTransactionalMongoAdapter(payload.db.name)
      ? 'ffffffffffffffffffffffff'
      : '2147483647'
    const missingVersionResponse = await restClient.GET(
      `/${mediaSlug}/file/${selected.version.original!.filename}?version=${missingVersionID}`,
    )

    expect(bareResponse.status).toBe(404)
    expect(wrongFileResponse.status).toBe(404)
    expect(missingVersionResponse.status).toBe(404)

    await payload.restoreVersion({ id: selected.id, collection: mediaSlug, overrideAccess: false })

    const current = await payload.findByID({
      id: created.id,
      collection: mediaSlug,
      showHiddenFields: true,
    })
    const { docs: after } = await payload.db.findVersions({
      collection: mediaSlug,
      pagination: false,
      where: { parent: { equals: created.id } },
    })

    expect(current.alt).toBe('A')
    expect(
      (await readFile(path.join(mediaDir, current.original!.filename!))).equals(firstBytes),
    ).toBe(true)
    expect((await readFile(path.join(mediaDir, current.filename!))).equals(firstBytes)).toBe(true)
    expect(current.filename).toBe(current.original?.filename)
    expect(after.find(({ id }) => id === selected.id)?.version).toEqual(selected.version)
    expect(after.some(({ version }) => version.alt === 'B')).toBe(true)

    const currentResponse = await restClient.GET(`/${mediaSlug}/file/${current.filename}`)
    const historicalAfterRestore = await restClient.GET(
      `/${mediaSlug}/file/${selected.version.original!.filename}?version=${selected.id}`,
    )

    expect(currentResponse.status).toBe(200)
    expect(Buffer.from(await currentResponse.arrayBuffer())).toEqual(firstBytes)
    expect(historicalAfterRestore.status).toBe(200)
    expect(Buffer.from(await historicalAfterRestore.arrayBuffer())).toEqual(firstBytes)

    await payload.db.deleteVersions({
      collection: mediaSlug,
      where: { id: { equals: selected.id } },
    })
    const prunedResponse = await restClient.GET(
      `/${mediaSlug}/file/${selected.version.original!.filename}?version=${selected.id}`,
    )

    expect(prunedResponse.status).toBe(404)
  })

  test('should archive the outgoing file when restoring a version without a file', async ({
    payload,
  }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({ collection: mediaSlug, data: { alt: 'no file' } })

    await payload.update({
      id: created.id,
      collection: mediaSlug,
      data: { alt: 'with file' },
      file: { name: 'later.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const { docs } = await payload.db.findVersions({
      collection: mediaSlug,
      pagination: false,
      where: { parent: { equals: created.id } },
    })
    const selected = docs.find(({ version }) => version.alt === 'no file')!

    await payload.restoreVersion({ id: selected.id, collection: mediaSlug, overrideAccess: false })

    const current = await payload.findByID({ id: created.id, collection: mediaSlug })
    const { docs: after } = await payload.db.findVersions({
      collection: mediaSlug,
      pagination: false,
      where: { parent: { equals: created.id } },
    })
    const outgoing = after.find(({ version }) => version.alt === 'with file')?.version

    expect(current.filename).toBeFalsy()
    expect(outgoing?.original?.filename).toBeTruthy()
    expect((await readFile(path.join(mediaDir, outgoing!.original!.filename))).equals(bytes)).toBe(
      true,
    )
  })

  test('should serve the retained original without running a request-time transform', async ({
    payload,
    restClient,
  }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: convertedMediaSlug,
      data: { alt: 'raw source' },
      file: { name: 'raw.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const originalFilename = created.original!.filename!
    const response = await restClient.GET(
      `/${convertedMediaSlug}/file/${originalFilename}?width=40`,
    )

    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer()).equals(bytes)).toBe(true)
  })

  test('should restore a saved converted output without replaying its transformation', async ({
    payload,
    restClient,
  }) => {
    const firstBytes = await readFile(imageFixture)
    const secondBytes = await sharp(firstBytes).flop().png().toBuffer()
    const created = await payload.create({
      collection: convertedMediaSlug,
      data: { alt: 'converted A' },
      file: {
        name: 'converted.png',
        data: firstBytes,
        mimetype: 'image/png',
        size: firstBytes.length,
      },
    })
    const firstOutput = await readFile(path.join(convertedMediaDir, created.filename!))

    await payload.update({
      id: created.id,
      collection: convertedMediaSlug,
      data: { alt: 'converted B' },
      file: {
        name: 'converted.png',
        data: secondBytes,
        mimetype: 'image/png',
        size: secondBytes.length,
      },
    })
    const { docs } = await payload.db.findVersions({
      collection: convertedMediaSlug,
      pagination: false,
      where: { parent: { equals: created.id } },
    })
    const selected = docs.find(({ version }) => version.alt === 'converted A')!
    const historical = await restClient.GET(
      `/${convertedMediaSlug}/file/${selected.version.filename}?version=${selected.id}&width=40`,
    )

    expect(historical.status).toBe(200)
    expect(Buffer.from(await historical.arrayBuffer()).equals(firstOutput)).toBe(true)

    await payload.restoreVersion({
      id: selected.id,
      collection: convertedMediaSlug,
      overrideAccess: false,
    })
    const current = await payload.findByID({
      id: created.id,
      collection: convertedMediaSlug,
      showHiddenFields: true,
    })

    expect(
      (await readFile(path.join(convertedMediaDir, current.filename!))).equals(firstOutput),
    ).toBe(true)
    expect(
      (await readFile(path.join(convertedMediaDir, current.original!.filename!))).equals(
        firstBytes,
      ),
    ).toBe(true)
    expect(current.filename).not.toBe(current.original?.filename)
  })

  test('should retain a removed variant in history without restoring it to the current file', async ({
    payload,
    restClient,
  }) => {
    const firstBytes = await readFile(imageFixture)
    const secondBytes = await sharp(firstBytes).flop().png().toBuffer()
    const created = await payload.create({
      collection: transformedMediaSlug,
      data: { alt: 'size A' },
      file: { name: 'size.png', data: firstBytes, mimetype: 'image/png', size: firstBytes.length },
    })
    const firstSize = await readFile(
      path.join(transformedMediaDir, created.variants!.small!.filename!),
    )

    await payload.update({
      id: created.id,
      collection: transformedMediaSlug,
      data: { alt: 'size B' },
      file: {
        name: 'size.png',
        data: secondBytes,
        mimetype: 'image/png',
        size: secondBytes.length,
      },
    })
    const { docs } = await payload.db.findVersions({
      collection: transformedMediaSlug,
      pagination: false,
      where: { parent: { equals: created.id } },
    })
    const selected = docs.find(({ version }) => version.alt === 'size A')!
    const selectedRead = await payload.findVersionByID({
      id: selected.id,
      collection: transformedMediaSlug,
      overrideAccess: false,
    })
    const selectedList = await payload.findVersions({
      collection: transformedMediaSlug,
      overrideAccess: false,
      where: { id: { equals: selected.id } },
    })

    for (const { version } of [selectedRead, selectedList.docs[0]!]) {
      for (const [url, bytes] of [
        [version.url, firstBytes],
        [version.original!.url, firstBytes],
        [version.variants!.small!.url, firstSize],
        [version.thumbnailURL, firstSize],
      ] as const) {
        expect(url).toBeTruthy()
        const parsed = new URL(url!, 'http://localhost')

        expect(parsed.searchParams.get('version')).toBe(String(selected.id))
        expect(parsed.searchParams.has('original')).toBe(false)
        const response = await restClient.GET(
          `${parsed.pathname.replace(/^\/api/, '')}${parsed.search}`,
        )

        expect(response.status).toBe(200)
        expect(Buffer.from(await response.arrayBuffer())).toEqual(bytes)
      }
    }

    const collection = payload.collections[transformedMediaSlug].config
    const variants = collection.upload.variants
    const maxPerDoc = collection.versions.maxPerDoc

    collection.upload.variants = []
    collection.versions.maxPerDoc = 3
    try {
      const historical = await restClient.GET(
        `/${transformedMediaSlug}/file/${selected.version.variants!.small!.filename}?version=${selected.id}`,
      )

      expect(historical.status).toBe(200)
      expect(Buffer.from(await historical.arrayBuffer()).equals(firstSize)).toBe(true)

      await payload.restoreVersion({
        id: selected.id,
        collection: transformedMediaSlug,
        overrideAccess: false,
      })
      const current = await payload.findByID({
        id: created.id,
        collection: transformedMediaSlug,
        showHiddenFields: true,
      })
      expect(current.variants?.small?.filename).toBeFalsy()
      const req = await createPayloadRequest({ payload })
      const variantCandidate = {
        key: selected.version.variants!.small!.filename!,
        roles: [{ type: 'size' as const, sizeKey: 'small' }],
      }
      await scheduleUnreferencedFileCleanup({ candidates: [variantCandidate], collection, req })
      expect(await readFile(path.join(transformedMediaDir, variantCandidate.key))).toEqual(
        firstSize,
      )
      const flattenedFields = collection.flattenedFields
      collection.flattenedFields = flattenedFields.map((field) =>
        field.type === 'group' && field.name === 'variants'
          ? { ...field, flattenedFields: [] }
          : field,
      )
      try {
        await scheduleUnreferencedFileCleanup({ candidates: [variantCandidate], collection, req })
        expect(await readFile(path.join(transformedMediaDir, variantCandidate.key))).toEqual(
          firstSize,
        )
      } finally {
        collection.flattenedFields = flattenedFields
      }
      const historicalAfterRestore = await restClient.GET(
        `/${transformedMediaSlug}/file/${selected.version.variants!.small!.filename}?version=${selected.id}`,
      )
      expect(historicalAfterRestore.status).toBe(200)
      expect(Buffer.from(await historicalAfterRestore.arrayBuffer()).equals(firstSize)).toBe(true)
    } finally {
      collection.upload.variants = variants
      collection.versions.maxPerDoc = maxPerDoc
    }
  })

  test('should reject a missing legacy source before changing the current document', async ({
    payload,
  }) => {
    const firstBytes = await readFile(imageFixture)
    const secondBytes = await sharp(firstBytes).flop().png().toBuffer()
    await mkdir(mediaDir, { recursive: true })
    await writeFile(path.join(mediaDir, 'legacy-restore.png'), firstBytes)
    const legacy = await payload.db.create({
      collection: mediaSlug,
      data: {
        alt: 'legacy A',
        filename: 'legacy-restore.png',
        filesize: firstBytes.length,
        mimeType: 'image/png',
        url: `/api/${mediaSlug}/file/legacy-restore.png`,
      },
    })

    await payload.update({
      id: legacy.id,
      collection: mediaSlug,
      data: { alt: 'legacy B' },
      file: { name: 'new.png', data: secondBytes, mimetype: 'image/png', size: secondBytes.length },
    })
    const { docs } = await payload.db.findVersions({
      collection: mediaSlug,
      pagination: false,
      where: { parent: { equals: legacy.id } },
    })
    const selected = docs.find(({ version }) => version.alt === 'legacy A')!

    await rm(path.join(mediaDir, selected.version.original!.filename))
    await expect(
      payload.restoreVersion({ id: selected.id, collection: mediaSlug, overrideAccess: false }),
    ).rejects.toThrow()

    const current = await payload.findByID({ id: legacy.id, collection: mediaSlug })

    expect(current.alt).toBe('legacy B')
    expect((await readFile(path.join(mediaDir, current.filename!))).equals(secondBytes)).toBe(true)
  })

  test('should require parent read access for current and archived file bytes', async ({
    payload,
    restClient,
  }) => {
    const firstBytes = await readFile(imageFixture)
    const secondBytes = await sharp(firstBytes).flop().png().toBuffer()
    const created = await payload.create({
      collection: mediaSlug,
      data: { alt: 'restricted' },
      file: {
        name: 'restricted.png',
        data: firstBytes,
        mimetype: 'image/png',
        size: firstBytes.length,
      },
    })
    const updated = await payload.update({
      id: created.id,
      collection: mediaSlug,
      data: { alt: 'restricted' },
      file: {
        name: 'restricted.png',
        data: secondBytes,
        mimetype: 'image/png',
        size: secondBytes.length,
      },
    })
    const { docs } = await payload.db.findVersions({
      collection: mediaSlug,
      pagination: false,
      where: { parent: { equals: created.id } },
    })
    const archived = docs.find(({ version }) => version.original?.filename !== updated.filename)!

    const currentResponse = await restClient.GET(`/${mediaSlug}/file/${updated.filename}`, {
      auth: false,
    })
    const archivedResponse = await restClient.GET(
      `/${mediaSlug}/file/${archived.version.original!.filename}?version=${archived.id}`,
      { auth: false },
    )

    expect(currentResponse.status).toBe(403)
    expect(archivedResponse.status).toBe(403)
    await expect(
      payload.findVersionByID({
        id: archived.id,
        collection: mediaSlug,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    await restClient.login({ slug: 'users', credentials: devUser })

    const authorizedResponse = await restClient.GET(
      `/${mediaSlug}/file/${archived.version.original!.filename}?version=${archived.id}`,
    )

    expect(authorizedResponse.status).toBe(200)
    expect(Buffer.from(await authorizedResponse.arrayBuffer()).equals(firstBytes)).toBe(true)
  })

  test('should require version read access for an archived file', async ({
    payload,
    restClient,
  }) => {
    const firstBytes = await readFile(imageFixture)
    const secondBytes = await sharp(firstBytes).flop().png().toBuffer()
    const created = await payload.create({
      collection: mediaSlug,
      data: { alt: 'version restricted' },
      file: {
        name: 'version-read.png',
        data: firstBytes,
        mimetype: 'image/png',
        size: firstBytes.length,
      },
    })
    const updated = await payload.update({
      id: created.id,
      collection: mediaSlug,
      data: { alt: 'public current' },
      file: {
        name: 'version-read.png',
        data: secondBytes,
        mimetype: 'image/png',
        size: secondBytes.length,
      },
    })
    const { docs } = await payload.db.findVersions({
      collection: mediaSlug,
      pagination: false,
      where: { parent: { equals: created.id } },
    })
    const archived = docs.find(({ version }) => version.alt === 'version restricted')!

    const currentResponse = await restClient.GET(`/${mediaSlug}/file/${updated.filename}`, {
      auth: false,
    })
    const archivedResponse = await restClient.GET(
      `/${mediaSlug}/file/${archived.version.original!.filename}?version=${archived.id}`,
      { auth: false },
    )

    expect(currentResponse.status).toBe(200)
    expect(archivedResponse.status).toBe(403)
  })

  test('should archive the outgoing original on a bulk file replacement', async ({ payload }) => {
    const firstBytes = await readFile(imageFixture)
    const secondBytes = await sharp(firstBytes).flop().png().toBuffer()
    const first = await payload.create({
      collection: mediaSlug,
      data: { alt: 'bulk first' },
      file: { name: 'bulk.png', data: firstBytes, mimetype: 'image/png', size: firstBytes.length },
    })

    const result = await payload.update({
      collection: mediaSlug,
      data: { alt: 'bulk second' },
      file: {
        name: 'bulk-replacement.png',
        data: secondBytes,
        mimetype: 'image/png',
        size: secondBytes.length,
      },
      where: { id: { equals: first.id } },
    })

    expect(result.errors).toEqual([])

    const { docs: versions } = await payload.db.findVersions({
      collection: mediaSlug,
      limit: 0,
      pagination: false,
      where: { parent: { equals: first.id } },
    })
    const archived = versions.find(({ version }) => version.alt === 'bulk first')?.version

    expect(archived?.original?.filename).toBeTruthy()
    expect(archived?.original?.filename).not.toBe(first.filename)
    expect(await readFile(path.join(mediaDir, archived!.original!.filename))).toEqual(firstBytes)
    expect(await readFile(path.join(mediaDir, result.docs[0]!.filename!))).toEqual(secondBytes)
  })

  for (const hasRequestTransformers of [false, true]) {
    test(`should serve the latest draft file with request transformers ${hasRequestTransformers}`, async ({
      payload,
      restClient,
    }) => {
      const published = await payload.create({
        collection: draftMediaSlug,
        data: { _status: 'published', alt: 'published' },
        filePath: imageFixture,
      })
      const priorDraft = await payload.update({
        id: published.id,
        collection: draftMediaSlug,
        data: { alt: 'prior draft' },
        draft: true,
        filePath: imageFixture,
      })
      const latestBytes = await sharp(await readFile(imageFixture))
        .negate()
        .png()
        .toBuffer()
      const latestDraft = await payload.update({
        id: published.id,
        collection: draftMediaSlug,
        data: { alt: 'latest draft' },
        draft: true,
        file: {
          name: 'latest.png',
          data: latestBytes,
          mimetype: 'image/png',
          size: latestBytes.length,
        },
      })
      const collection = payload.collections[draftMediaSlug].config
      const readAccess = collection.access.read
      const transformers = payload.config.upload.transformers

      if (!hasRequestTransformers) {
        payload.config.upload.transformers = []
      }

      try {
        collection.access.read = () => ({ alt: { equals: 'latest draft' } })
        const response = await restClient.GET(`/${draftMediaSlug}/file/${latestDraft.filename}`)

        expect(response.status).toBe(200)
        expect(Buffer.from(await response.arrayBuffer())).toEqual(latestBytes)

        collection.access.read = () => true
        const priorResponse = await restClient.GET(`/${draftMediaSlug}/file/${priorDraft.filename}`)
        const publishedResponse = await restClient.GET(
          `/${draftMediaSlug}/file/${published.filename}`,
        )

        expect(priorResponse.status).toBe(404)
        expect(publishedResponse.status).toBe(200)

        collection.access.read = () => ({ _status: { equals: 'published' } })
        const deniedResponse = await restClient.GET(
          `/${draftMediaSlug}/file/${latestDraft.filename}`,
        )

        expect(deniedResponse.status).toBe(403)
      } finally {
        collection.access.read = readAccess
        payload.config.upload.transformers = transformers
      }
    })
  }

  test('should preserve stored files through draft, autosave, publish, and unpublish', async ({
    payload,
  }) => {
    const publishedBytes = await readFile(imageFixture)
    const draftBytes = await sharp(publishedBytes).flop().png().toBuffer()
    const laterDraftBytes = await sharp(publishedBytes).negate().png().toBuffer()
    const published = await payload.create({
      collection: draftMediaSlug,
      data: { _status: 'published', alt: 'published' },
      file: {
        name: 'draft.png',
        data: publishedBytes,
        mimetype: 'image/png',
        size: publishedBytes.length,
      },
    })

    await payload.update({
      id: published.id,
      collection: draftMediaSlug,
      data: { alt: 'draft replacement' },
      draft: true,
      file: { name: 'draft.png', data: draftBytes, mimetype: 'image/png', size: draftBytes.length },
    })
    await payload.update({
      id: published.id,
      collection: draftMediaSlug,
      data: { alt: 'later draft' },
      draft: true,
      file: {
        name: 'draft.png',
        data: laterDraftBytes,
        mimetype: 'image/png',
        size: laterDraftBytes.length,
      },
    })

    const current = await payload.db.findOne({
      collection: draftMediaSlug,
      where: { id: { equals: published.id } },
    })
    const { docs: versions } = await payload.db.findVersions({
      collection: draftMediaSlug,
      limit: 0,
      pagination: false,
      where: { parent: { equals: published.id } },
    })
    const publishedVersion = versions.find(({ version }) => version.alt === 'published')?.version
    const draftVersion = versions.find(
      ({ version }) => version.alt === 'draft replacement',
    )?.version

    expect(current?.filename).toBe(published.filename)
    expect(await readFile(path.join(draftMediaDir, current!.filename))).toEqual(publishedBytes)
    expect(publishedVersion?.original?.filename).not.toBe(published.filename)
    expect(await readFile(path.join(draftMediaDir, publishedVersion!.original!.filename))).toEqual(
      publishedBytes,
    )
    expect(await readFile(path.join(draftMediaDir, draftVersion!.original!.filename))).toEqual(
      draftBytes,
    )

    await payload.update({
      id: published.id,
      autosave: true,
      collection: draftMediaSlug,
      data: { alt: 'autosaved draft' },
    })
    const afterPublish = await payload.update({
      id: published.id,
      collection: draftMediaSlug,
      data: { _status: 'published' },
    })

    expect(afterPublish._status).toBe('published')
    expect(await readFile(path.join(draftMediaDir, afterPublish.filename!))).toEqual(
      laterDraftBytes,
    )

    const afterUnpublish = await payload.update({
      id: published.id,
      collection: draftMediaSlug,
      data: { _status: 'draft' },
    })

    expect(afterUnpublish._status).toBe('draft')
    expect(await readFile(path.join(draftMediaDir, draftVersion!.original!.filename))).toEqual(
      draftBytes,
    )
  })

  test.options(
    'should roll back an archived revision when a later hook rejects replacement',
    { db: isTransactionalMongoAdapter },
    async ({ payload }) => {
      const firstBytes = await readFile(imageFixture)
      const secondBytes = await sharp(firstBytes).flop().png().toBuffer()
      const first = await payload.create({
        collection: mediaSlug,
        data: { alt: 'before' },
        file: {
          name: 'rollback.png',
          data: firstBytes,
          mimetype: 'image/png',
          size: firstBytes.length,
        },
      })
      const filesBefore = await readdir(mediaDir)

      await expect(
        payload.update({
          id: first.id,
          collection: mediaSlug,
          data: { alt: 'reject-after-write' },
          file: {
            name: 'rollback.png',
            data: secondBytes,
            mimetype: 'image/png',
            size: secondBytes.length,
          },
        }),
      ).rejects.toThrow('Rejected after the file and document write')

      const { docs: versions } = await payload.db.findVersions({
        collection: mediaSlug,
        where: { parent: { equals: first.id } },
      })

      expect(await readdir(mediaDir)).toEqual(filesBefore)
      expect(versions).toHaveLength(1)
      expect(versions[0]?.version.original?.filename).toBe(first.filename)
      expect(await readFile(path.join(mediaDir, first.filename!))).toEqual(firstBytes)
    },
  )

  test('should retain a historical file when the current file is removed', async ({ payload }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: mediaSlug,
      data: { alt: 'before removal' },
      file: { name: 'removed.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })

    await payload.update({
      id: created.id,
      collection: mediaSlug,
      data: {
        alt: 'without file',
        filename: null,
        original: { filename: null, filesize: null, mimeType: null, url: null },
      },
      overrideAccess: true,
    })

    const { docs: versions } = await payload.db.findVersions({
      collection: mediaSlug,
      limit: 0,
      pagination: false,
      where: { parent: { equals: created.id } },
    })
    const previous = versions.find(({ version }) => version.alt === 'before removal')?.version

    expect(previous?.original?.filename).not.toBe(created.filename)
    expect(await readFile(path.join(mediaDir, previous!.original!.filename))).toEqual(bytes)
  })

  test('should delete a stored file only after its last version is pruned', async ({ payload }) => {
    const collection = payload.collections[mediaSlug].config
    const previousVersions = collection.versions
    collection.versions = { ...previousVersions, maxPerDoc: 5 }

    try {
      const first = await payload.create({
        collection: mediaSlug,
        data: { alt: 'first' },
        filePath: imageFixture,
      })

      await payload.update({
        id: first.id,
        collection: mediaSlug,
        data: { alt: 'second' },
        filePath: path.resolve(dirname, '../uploads/small.png'),
      })

      const { docs: initialVersions } = await payload.db.findVersions({
        collection: mediaSlug,
        pagination: false,
        where: { parent: { equals: first.id } },
      })
      const firstVersion = initialVersions.find(({ version }) => version.alt === 'first')!
      const archivedOriginal = firstVersion.version.original!.filename!

      expect(await readFile(path.join(mediaDir, archivedOriginal))).toBeTruthy()

      for (let revision = 3; revision <= 6; revision++) {
        await payload.update({
          id: first.id,
          collection: mediaSlug,
          data: { alt: `revision ${revision}` },
        })
      }

      const { docs: retained } = await payload.db.findVersions({
        collection: mediaSlug,
        pagination: false,
        where: { parent: { equals: first.id } },
      })

      expect(retained).toHaveLength(5)
      expect(retained.some(({ id }) => id === firstVersion.id)).toBe(false)
      await expect(stat(path.join(mediaDir, archivedOriginal))).rejects.toMatchObject({
        code: 'ENOENT',
      })
      expect(
        await readFile(path.join(mediaDir, retained[0]!.version.original!.filename)),
      ).toBeTruthy()
    } finally {
      collection.versions = previousVersions
    }
  })

  test('should retain unlimited versions until a permanent delete removes their files', async ({
    payload,
    restClient,
  }) => {
    const collection = payload.collections[mediaSlug].config
    const previousVersions = collection.versions
    collection.versions = { ...previousVersions, maxPerDoc: 0 }

    try {
      const first = await payload.create({
        collection: mediaSlug,
        data: { alt: 'first' },
        filePath: imageFixture,
      })

      for (let revision = 2; revision <= 4; revision++) {
        await payload.update({
          id: first.id,
          collection: mediaSlug,
          data: { alt: `revision ${revision}` },
          filePath: path.resolve(dirname, '../uploads/small.png'),
        })
      }

      const { docs: latest } = await payload.db.findVersions({
        collection: mediaSlug,
        limit: 1,
        where: { parent: { equals: first.id } },
      })
      const now = new Date().toISOString()

      for (let revision = 5; revision <= 105; revision++) {
        await payload.db.createVersion({
          autosave: false,
          collectionSlug: mediaSlug,
          createdAt: now,
          parent: first.id,
          updatedAt: now,
          versionData: { ...latest[0]!.version, alt: `revision ${revision}` },
        })
      }

      const { docs: versions } = await payload.db.findVersions({
        collection: mediaSlug,
        limit: 0,
        pagination: false,
        where: { parent: { equals: first.id } },
      })
      const current = await payload.db.findOne({
        collection: mediaSlug,
        where: { id: { equals: first.id } },
      })
      const storedKeys = new Set([
        ...storedFilenames(current!),
        ...versions.flatMap(({ version }) => storedFilenames(version)),
      ])

      expect(versions).toHaveLength(105)
      const oldest = versions.find(({ version }) => version.alt === 'first')!
      const historicalResponse = await restClient.GET(
        `/${mediaSlug}/file/${oldest.version.original!.filename}?version=${oldest.id}`,
      )

      expect(historicalResponse.status).toBe(200)
      const req = await createPayloadRequest({ payload })
      const collected = await collectVersionFiles({
        collection,
        parentID: first.id,
        req,
      })

      expect(new Set(collected.map(({ key }) => key))).toEqual(storedKeys)
      await payload.delete({ id: first.id, collection: mediaSlug, overrideAccess: true })

      expect((await readdir(mediaDir)).filter((key) => storedKeys.has(key))).toEqual([])
    } finally {
      collection.versions = previousVersions
    }
  })

  test('should delete an unversioned file after it is removed from the document', async ({
    payload,
  }) => {
    const collection = payload.collections[mediaSlug].config
    const previousVersions = collection.versions
    Object.assign(collection, { versions: false })

    try {
      const created = await payload.create({
        collection: mediaSlug,
        data: { alt: 'with file' },
        filePath: imageFixture,
      })
      const filename = created.original!.filename!

      await payload.update({
        id: created.id,
        collection: mediaSlug,
        data: {
          alt: 'without file',
          filename: null,
          original: { filename: null, filesize: null, mimeType: null, url: null },
        },
        overrideAccess: true,
      })

      await expect(stat(path.join(mediaDir, filename))).rejects.toMatchObject({ code: 'ENOENT' })
    } finally {
      collection.versions = previousVersions
    }
  })

  test('should retain a legacy file referenced by another document', async ({ payload }) => {
    const bytes = await readFile(imageFixture)
    const filename = 'legacy-folder/shared.png'
    await mkdir(path.join(mediaDir, 'legacy-folder'), { recursive: true })
    await writeFile(path.join(mediaDir, filename), bytes)
    await payload.db.create({
      collection: mediaSlug,
      data: {
        alt: 'legacy shared source',
        filename,
        filesize: bytes.length,
        mimeType: 'image/png',
        url: `/api/${mediaSlug}/file/${encodeURIComponent(filename)}`,
      },
    })
    const req = await createPayloadRequest({ payload })

    await scheduleUnreferencedFileCleanup({
      candidates: [{ key: filename, roles: [{ type: 'original' }] }],
      collection: payload.collections[mediaSlug].config,
      req,
    })

    expect(await readFile(path.join(mediaDir, filename))).toEqual(bytes)
  })

  test('should limit cleanup reads as unrelated documents and history grow', async ({
    payload,
  }) => {
    const collection = payload.collections[mediaSlug].config
    const req = await createPayloadRequest({ payload })
    const filename = 'cleanup-candidate.png'
    const measurements: Array<{
      calls: number
      durationMS: number
      rows: number
      rssDelta: number
      unfiltered: number
      unrelated: number
    }> = []
    const queries: Array<{ rows: number; where: unknown }> = []
    const find = payload.db.find.bind(payload.db)
    const findVersions = payload.db.findVersions.bind(payload.db)
    const findSpy = vi.spyOn(payload.db, 'find').mockImplementation(async (args) => {
      if (queries.length > 100) {
        throw new Error('Cleanup exceeded the expected baseline page count')
      }
      const result = await find(args)
      if (args.collection === mediaSlug) {
        queries.push({ rows: result.docs.length, where: args.where })
      }
      return result
    })
    const versionsSpy = vi.spyOn(payload.db, 'findVersions').mockImplementation(async (args) => {
      if (queries.length > 100) {
        throw new Error('Cleanup exceeded the expected baseline page count')
      }
      const result = await findVersions(args)
      if (args.collection === mediaSlug) {
        queries.push({ rows: result.docs.length, where: args.where })
      }
      return result
    })
    let seeded = 0

    try {
      for (const unrelated of [0, 100, 500]) {
        while (seeded < unrelated) {
          const count = Math.min(25, unrelated - seeded)
          await Promise.all(
            Array.from({ length: count }, async (_, offset) => {
              const name = `unrelated-${seeded + offset}.png`
              const doc = await payload.db.create({
                collection: mediaSlug,
                data: { alt: 'x'.repeat(4096), filename: name },
              })
              await payload.db.createVersion({
                autosave: false,
                collectionSlug: mediaSlug,
                parent: doc.id,
                versionData: { alt: 'x'.repeat(4096), filename: name },
              })
            }),
          )
          seeded += count
        }
        await mkdir(mediaDir, { recursive: true })
        await writeFile(path.join(mediaDir, filename), 'owned cleanup candidate')
        queries.length = 0
        const rssBefore = process.memoryUsage().rss
        const started = performance.now()

        await scheduleUnreferencedFileCleanup({
          candidates: [{ key: filename, roles: [{ type: 'original' }] }],
          collection,
          req,
        })

        measurements.push({
          calls: queries.length,
          durationMS: Number((performance.now() - started).toFixed(2)),
          rows: queries.reduce((total, query) => total + query.rows, 0),
          rssDelta: process.memoryUsage().rss - rssBefore,
          unfiltered: queries.filter(({ where }) => !where || Object.keys(where).length === 0)
            .length,
          unrelated,
        })
        findSpy.mockClear()
        versionsSpy.mockClear()
        await expect(stat(path.join(mediaDir, filename))).rejects.toMatchObject({ code: 'ENOENT' })
      }
      console.info(
        'File cleanup query measurements:',
        JSON.stringify({ database: payload.db.name, measurements }),
      )
      expect(measurements.map(({ rows }) => rows)).toEqual([0, 0, 0])
      expect(measurements.map(({ unfiltered }) => unfiltered)).toEqual([0, 0, 0])
      expect(measurements.every(({ calls }) => calls <= 4)).toBe(true)
    } finally {
      findSpy.mockRestore()
      versionsSpy.mockRestore()
    }
  })

  test('should remove managed files after a bulk permanent delete', async ({ payload }) => {
    const first = await payload.create({
      collection: mediaSlug,
      data: { alt: 'first' },
      filePath: imageFixture,
    })
    const second = await payload.create({
      collection: mediaSlug,
      data: { alt: 'second' },
      filePath: imageFixture,
    })
    const filenames = [first.original!.filename!, second.original!.filename!]

    const deleted = await payload.delete({
      collection: mediaSlug,
      overrideAccess: true,
      select: { id: true },
      where: { id: { in: [first.id, second.id] } },
    })

    expect(deleted.docs).toHaveLength(2)
    for (const filename of filenames) {
      await expect(stat(path.join(mediaDir, filename))).rejects.toMatchObject({ code: 'ENOENT' })
    }
  })

  for (const mode of ['bulk', 'individual'] as const) {
    test.options(
      `should clean persisted ${mode} deletes despite a failed afterDelete hook`,
      { db: (adapter) => mode === 'bulk' || adapter === 'sqlite' },
      async ({ payload }) => {
        const first = await payload.create({
          collection: mediaSlug,
          data: { alt: 'first' },
          filePath: imageFixture,
        })
        await payload.update({
          id: first.id,
          collection: mediaSlug,
          data: {},
          filePath: imageFixture,
        })
        const second = await payload.create({
          collection: mediaSlug,
          data: { alt: 'afterDelete failure' },
          filePath: imageFixture,
        })
        const blocked = await payload.create({
          collection: mediaSlug,
          data: { alt: 'beforeDelete failure' },
          filePath: imageFixture,
        })
        const collection = payload.collections[mediaSlug].config
        const req = await createPayloadRequest({ payload })
        const blockedFiles = new Set(
          (await collectVersionFiles({ collection, parentID: blocked.id, req })).map(
            ({ key }) => key,
          ),
        )
        const filesBefore = await readdir(mediaDir)
        const beforeDelete = collection.hooks.beforeDelete
        const afterDelete = collection.hooks.afterDelete
        const bulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

        payload.db.bulkOperationsSingleTransaction = mode === 'individual'
        collection.hooks.beforeDelete = [
          ...(beforeDelete ?? []),
          ({ id }) => {
            if (String(id) === String(blocked.id)) {
              throw new Error('Rejected before deletion')
            }
          },
        ]
        collection.hooks.afterDelete = [
          ...(afterDelete ?? []),
          ({ id }) => {
            if (String(id) === String(second.id)) {
              throw new Error('Rejected after deletion')
            }
          },
        ]

        try {
          const result = await payload.delete({
            collection: mediaSlug,
            overrideAccess: true,
            select: { id: true },
            where: { id: { in: [first.id, second.id, blocked.id] } },
          })

          expect(result.docs.map(({ id }) => id)).toEqual([first.id])
          expect(result.errors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ id: second.id, message: 'Rejected after deletion' }),
              expect.objectContaining({ id: blocked.id, message: 'Rejected before deletion' }),
            ]),
          )
          expect(result.errors).toHaveLength(2)
          const remaining = await payload.db.find({ collection: mediaSlug, pagination: false })
          const versions = await payload.db.findVersions({
            collection: mediaSlug,
            pagination: false,
          })

          expect(remaining.docs.map(({ id }) => id)).toEqual([blocked.id])
          expect(versions.docs.length).toBeGreaterThan(0)
          expect(versions.docs.every(({ parent }) => String(parent) === String(blocked.id))).toBe(
            true,
          )
          expect(
            filesBefore.filter((filename) => !blockedFiles.has(filename)).length,
          ).toBeGreaterThan(2)
          expect(new Set(await readdir(mediaDir))).toEqual(blockedFiles)
        } finally {
          collection.hooks.beforeDelete = beforeDelete
          collection.hooks.afterDelete = afterDelete
          payload.db.bulkOperationsSingleTransaction = bulkOperationsSingleTransaction
        }
      },
    )
  }

  test('should clean a nontransactional delete when its afterOperation hook fails', async ({
    payload,
  }) => {
    const created = await payload.create({
      collection: mediaSlug,
      data: { alt: 'before delete' },
      filePath: imageFixture,
    })
    const hooks = payload.collections[mediaSlug].config.hooks
    const afterOperation = hooks.afterOperation

    hooks.afterOperation = [
      ...(afterOperation ?? []),
      ({ operation, result }) => {
        if (operation === 'deleteByID') {
          throw new Error('Rejected delete response')
        }
        return result
      },
    ]

    try {
      await expect(
        payload.delete({
          id: created.id,
          collection: mediaSlug,
          disableTransaction: true,
          overrideAccess: true,
        }),
      ).rejects.toThrow('Rejected delete response')

      expect(
        await payload.db.findOne({ collection: mediaSlug, where: { id: { equals: created.id } } }),
      ).toBeNull()
      const versions = await payload.db.findVersions({
        collection: mediaSlug,
        where: { parent: { equals: created.id } },
      })

      expect(versions.docs).toEqual([])
      await expect(stat(path.join(mediaDir, created.original!.filename!))).rejects.toMatchObject({
        code: 'ENOENT',
      })
    } finally {
      hooks.afterOperation = afterOperation
    }
  })

  test('should clean a persisted nested delete when a nontransactional outer update fails', async ({
    payload,
  }) => {
    const child = await payload.create({
      collection: mediaSlug,
      data: { alt: 'child' },
      filePath: imageFixture,
    })
    const outer = await payload.create({ collection: mediaSlug, data: { alt: 'outer' } })
    const hooks = payload.collections[mediaSlug].config.hooks
    const beforeChange = hooks.beforeChange
    const filename = child.original!.filename!

    hooks.beforeChange = [
      ...(beforeChange ?? []),
      async ({ data, req }) => {
        if (data.alt !== 'reject-after-write') {
          return data
        }
        await payload.delete({
          id: child.id,
          collection: mediaSlug,
          disableTransaction: true,
          overrideAccess: true,
          req,
        })
        expect(await readFile(path.join(mediaDir, filename))).toEqual(await readFile(imageFixture))
        return data
      },
    ]

    try {
      await expect(
        payload.update({
          id: outer.id,
          collection: mediaSlug,
          data: { alt: 'reject-after-write' },
          disableTransaction: true,
          overrideAccess: true,
        }),
      ).rejects.toThrow('Rejected after the file and document write')

      expect(
        await payload.db.findOne({ collection: mediaSlug, where: { id: { equals: child.id } } }),
      ).toBeNull()
      expect(
        await payload.db.findOne({ collection: mediaSlug, where: { id: { equals: outer.id } } }),
      ).toBeTruthy()
      const versions = await payload.db.findVersions({
        collection: mediaSlug,
        where: { parent: { equals: child.id } },
      })

      expect(versions.docs).toEqual([])
      await expect(stat(path.join(mediaDir, filename))).rejects.toMatchObject({ code: 'ENOENT' })
    } finally {
      hooks.beforeChange = beforeChange
    }
  })

  test('should keep a trashed upload through restore and remove it on permanent delete', async ({
    payload,
  }) => {
    const created = await payload.create({
      collection: trashMediaSlug,
      data: { alt: 'before trash' },
      filePath: imageFixture,
    })
    const filename = created.original!.filename!

    await payload.update({
      id: created.id,
      collection: trashMediaSlug,
      data: { deletedAt: new Date().toISOString() },
    })

    expect(await readFile(path.join(trashMediaDir, filename))).toBeTruthy()

    await payload.update({
      id: created.id,
      collection: trashMediaSlug,
      data: { deletedAt: null },
      trash: true,
    })

    expect(await readFile(path.join(trashMediaDir, filename))).toBeTruthy()

    await payload.delete({ id: created.id, collection: trashMediaSlug })

    await expect(stat(path.join(trashMediaDir, filename))).rejects.toMatchObject({ code: 'ENOENT' })
  })

  test.options(
    'should keep files when an outer transaction rolls back a nested delete',
    { db: isTransactionalMongoAdapter },
    async ({ payload }) => {
      const created = await payload.create({
        collection: mediaSlug,
        data: { alt: 'before delete' },
        filePath: imageFixture,
      })
      const filename = created.original!.filename!
      const req = await createPayloadRequest({ payload })

      expect(await initTransaction(req)).toBe(true)
      await payload.delete({
        id: created.id,
        collection: mediaSlug,
        disableTransaction: true,
        overrideAccess: true,
        req,
      })

      expect(await readFile(path.join(mediaDir, filename))).toBeTruthy()
      await killTransaction(req)
      expect(await readFile(path.join(mediaDir, filename))).toBeTruthy()
      expect(
        await payload.db.findOne({ collection: mediaSlug, where: { id: { equals: created.id } } }),
      ).toBeTruthy()
    },
  )

  test.options(
    'should keep files when an afterDelete hook rejects the operation',
    { db: isTransactionalMongoAdapter },
    async ({ payload }) => {
      const created = await payload.create({
        collection: mediaSlug,
        data: { alt: 'before delete' },
        filePath: imageFixture,
      })
      const hooks = payload.collections[mediaSlug].config.hooks
      const originalHooks = hooks.afterDelete
      hooks.afterDelete = [
        ...(originalHooks ?? []),
        () => {
          throw new Error('Rejected delete after the database write')
        },
      ]

      try {
        await expect(
          payload.delete({ id: created.id, collection: mediaSlug, overrideAccess: true }),
        ).rejects.toThrow('Rejected delete after the database write')
      } finally {
        hooks.afterDelete = originalHooks
      }

      expect(await readFile(path.join(mediaDir, created.original!.filename!))).toBeTruthy()
      expect(
        await payload.db.findOne({ collection: mediaSlug, where: { id: { equals: created.id } } }),
      ).toBeTruthy()
    },
  )

  test('should read an untouched legacy local file without changing stored data or files', async ({
    payload,
  }) => {
    await mkdir(mediaDir, { recursive: true })
    await copyFile(imageFixture, path.join(mediaDir, 'legacy.png'))

    const legacy = await payload.db.create({
      collection: mediaSlug,
      data: {
        alt: 'legacy',
        filename: 'legacy.png',
        filesize: (await readFile(imageFixture)).byteLength,
        mimeType: 'image/png',
        url: `/api/${mediaSlug}/file/legacy.png`,
      },
    })
    const filesBeforeRead = await readdir(mediaDir)

    const read = await payload.findByID({
      id: legacy.id,
      collection: mediaSlug,
      showHiddenFields: true,
    })

    expect(read.original).toMatchObject({
      filename: 'legacy.png',
      filesize: legacy.filesize,
      mimeType: 'image/png',
      url: `/api/${mediaSlug}/file/legacy.png`,
    })
    expect(read.original?.filename).toBe(read.filename)
    expect(await readdir(mediaDir)).toEqual(filesBeforeRead)

    const stored = await payload.db.findOne({
      collection: mediaSlug,
      where: { id: { equals: legacy.id } },
    })

    expect(stored?.original?.filename).toBeFalsy()
  })

  test('should use a previously cropped stored file as the best available original', async ({
    payload,
  }) => {
    await mkdir(mediaDir, { recursive: true })
    const croppedBytes = await sharp(imageFixture)
      .extract({ height: 20, left: 0, top: 0, width: 40 })
      .png()
      .toBuffer()

    await writeFile(path.join(mediaDir, 'cropped.png'), croppedBytes)

    const legacy = await payload.db.create({
      collection: mediaSlug,
      data: {
        alt: 'cropped before upgrade',
        filename: 'cropped.png',
        filesize: croppedBytes.byteLength,
        height: 20,
        mimeType: 'image/png',
        url: `/api/${mediaSlug}/file/cropped.png`,
        width: 40,
      },
    })

    const read = await payload.findByID({
      id: legacy.id,
      collection: mediaSlug,
      showHiddenFields: true,
    })

    expect(read.original).toMatchObject({
      filename: 'cropped.png',
      height: 20,
      width: 40,
    })
    expect(read.filename).toBe('cropped.png')
  })

  test('should synthesize each legacy version from its own saved file fields', async ({
    payload,
  }) => {
    await mkdir(mediaDir, { recursive: true })
    await Promise.all(
      ['a.png', 'b.png'].map((filename) => copyFile(imageFixture, path.join(mediaDir, filename))),
    )

    const parent = await payload.db.create({ collection: mediaSlug, data: { alt: 'current' } })
    const now = new Date().toISOString()

    for (const [alt, filename] of [
      ['first A', 'a.png'],
      ['second A', 'a.png'],
      ['first B', 'b.png'],
    ]) {
      await payload.db.createVersion({
        collectionSlug: mediaSlug,
        createdAt: now,
        parent: parent.id,
        updatedAt: now,
        versionData: {
          alt,
          filename,
          filesize: 123,
          mimeType: 'image/png',
          url: `/api/${mediaSlug}/file/${filename}`,
        },
      })
    }

    const filesBeforeRead = await readdir(mediaDir)
    const { docs } = await payload.findVersions({
      collection: mediaSlug,
      showHiddenFields: true,
      where: { parent: { equals: parent.id } },
    })
    const filesByAlt = Object.fromEntries(
      docs.map(({ version }) => [version.alt, version.original?.filename]),
    )

    expect(filesByAlt['first A']).toEqual(filesByAlt['second A'])
    expect(filesByAlt['first A']).toBe('a.png')
    expect(filesByAlt['first B']).toBe('b.png')
    expect(await readdir(mediaDir)).toEqual(filesBeforeRead)

    const storedVersions = await payload.db.findVersions({
      collection: mediaSlug,
      where: { parent: { equals: parent.id } },
    })

    expect(storedVersions.docs.every(({ version }) => !version.original?.filename)).toBe(true)
  })

  test('should not claim a custom URL as a Payload-managed file', async ({ payload }) => {
    const external = await payload.db.create({
      collection: mediaSlug,
      data: {
        alt: 'external',
        filename: 'external.png',
        filesize: 123,
        mimeType: 'image/png',
        url: 'https://example.com/custom.png',
      },
    })

    const read = await payload.findByID({
      id: external.id,
      collection: mediaSlug,
      showHiddenFields: true,
    })

    expect(read.original?.filename).toBeFalsy()
  })

  for (const operation of ['bulk replacement', 'version restore'] as const) {
    test(`should clean files pruned by a ${operation}`, async ({ payload }) => {
      const collection = payload.collections[mediaSlug].config
      const previousVersions = collection.versions
      collection.versions = { ...previousVersions, maxPerDoc: 2 }

      try {
        const created = await payload.create({
          collection: mediaSlug,
          data: { alt: 'first' },
          filePath: imageFixture,
        })
        await payload.update({
          id: created.id,
          collection: mediaSlug,
          data: { alt: 'second' },
          filePath: path.resolve(dirname, '../uploads/small.png'),
        })
        if (operation === 'bulk replacement') {
          collection.versions.maxPerDoc = 1
          await payload.update({
            collection: mediaSlug,
            data: { alt: 'third' },
            filePath: imageFixture,
            where: { id: { equals: created.id } },
          })
        } else {
          const { docs } = await payload.db.findVersions({
            collection: mediaSlug,
            sort: '-updatedAt',
            where: { parent: { equals: created.id } },
          })
          await payload.restoreVersion({
            id: docs[0]!.id,
            collection: mediaSlug,
            overrideAccess: true,
          })
        }
        const current = await payload.db.findOne({
          collection: mediaSlug,
          where: { id: { equals: created.id } },
        })
        const { docs } = await payload.db.findVersions({
          collection: mediaSlug,
          pagination: false,
          where: { parent: { equals: created.id } },
        })
        const expected = [
          ...new Set([current!, ...docs.map(({ version }) => version)].flatMap(storedFilenames)),
        ].sort()

        expect((await readdir(mediaDir)).sort()).toEqual(expected)
      } finally {
        collection.versions = previousVersions
      }
    })
  }

  for (const operation of ['bulk update', 'version restore'] as const) {
    test.options(
      `should compensate nested uploads when a ${operation} rolls back`,
      { db: (adapter) => ['documentdb', 'mongodb', 'mongodb-atlas'].includes(adapter) },
      async ({ payload }) => {
        const created = await payload.create({
          collection: mediaSlug,
          data: { alt: 'outer' },
          filePath: imageFixture,
        })
        const { docs } = await payload.db.findVersions({
          collection: mediaSlug,
          where: { parent: { equals: created.id } },
        })
        const hooks = payload.collections[mediaSlug].config.hooks
        const beforeChange = hooks.beforeChange
        const afterChange = hooks.afterChange
        const bulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction
        payload.db.bulkOperationsSingleTransaction = true
        hooks.beforeChange = [
          ...beforeChange,
          async ({ data, req }) => {
            await payload.create({
              collection: plainMediaSlug,
              data: { alt: 'nested' },
              filePath: imageFixture,
              req,
            })
            expect((await readdir(plainMediaDir)).length).toBeGreaterThan(0)
            return data
          },
        ]
        hooks.afterChange = [
          ...afterChange,
          () => {
            throw new Error('Outer proxy operation failed')
          },
        ]

        try {
          if (operation === 'bulk update') {
            const result = await payload.update({
              collection: mediaSlug,
              data: { alt: 'failed' },
              where: { id: { equals: created.id } },
            })
            expect(result.errors).toHaveLength(1)
            expect(result.errors[0]?.message).toBe('Outer proxy operation failed')
          } else {
            await expect(
              payload.restoreVersion({
                id: docs[0]!.id,
                collection: mediaSlug,
                overrideAccess: true,
              }),
            ).rejects.toThrow('Outer proxy operation failed')
          }
          expect(await readdir(plainMediaDir)).toEqual([])
          expect((await payload.count({ collection: plainMediaSlug })).totalDocs).toBe(0)
        } finally {
          hooks.beforeChange = beforeChange
          hooks.afterChange = afterChange
          payload.db.bulkOperationsSingleTransaction = bulkOperationsSingleTransaction
          await rm(plainMediaDir, { force: true, recursive: true })
        }
      },
    )
  }
})
