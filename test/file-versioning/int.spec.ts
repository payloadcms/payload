/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Tests use the shared fixture wrapper. */
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPayloadRequest } from 'payload'
import sharp from 'sharp'
import { expect } from 'vitest'

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
  transformedMediaDir,
  transformedMediaSlug,
  trashMediaDir,
  trashMediaSlug,
} from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const imageFixture = path.resolve(dirname, '../uploads/image.png')
const pdfFixture = path.resolve(dirname, '../uploads/image-as-pdf.pdf')
const videoFixture = path.resolve(dirname, '../uploads/christmas-mariachi-in-guadalajara.mp4')

const original = {
  filename: 'photo-original.jpg',
  filesize: 123,
  height: 50,
  mimeType: 'image/jpeg',
  url: '/api/file-versioned-media/file/photo-original.jpg',
  width: 100,
}

const managedFiles = [
  {
    key: 'photo-original.jpg',
    roles: [{ type: 'original' }, { type: 'default' }],
    storageBackendId: 'local:file-versioned-media',
  },
]

test.suite('File versioning fields', { config: './config.ts' }, () => {
  test.afterEach(async () => {
    await rm(mediaDir, { force: true, recursive: true })
    await rm(draftMediaDir, { force: true, recursive: true })
    await rm(transformedMediaDir, { force: true, recursive: true })
    await rm(convertedMediaDir, { force: true, recursive: true })
    await rm(trashMediaDir, { force: true, recursive: true })
  })

  test('should ignore a client supplied original and manifest', async ({ payload }) => {
    const created = await payload.create({
      collection: mediaSlug,
      data: {
        _fileRevision: 'forged',
        _managedFiles: managedFiles,
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
    expect(internal._managedFiles).toBeFalsy()
    expect(internal._fileRevision).toBeFalsy()
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
    expect(stored._managedFiles).toEqual([
      {
        key: created.filename,
        roles: [{ type: 'original' }, { type: 'default' }],
        storageBackendId: `local:${mediaSlug}`,
      },
    ])
    expect(persisted?.original).toMatchObject(stored.original!)
    expect(persisted?._managedFiles).toEqual(stored._managedFiles)
    const { docs: versions } = await payload.db.findVersions({
      collection: mediaSlug,
      where: { parent: { equals: created.id } },
    })

    expect(versions[0]?.version.original).toMatchObject(persisted?.original)
    expect(versions[0]?.version._managedFiles).toEqual(persisted?._managedFiles)
    expect(await readdir(mediaDir)).toEqual(['photo-1-original.png'])
    expect(await readFile(path.join(mediaDir, created.filename!))).toEqual(bytes)
  })

  test('should expose the original but not the managed manifest in read APIs', async ({
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
    expect(local._managedFiles).toBeUndefined()
    expect(rest._managedFiles).toBeUndefined()
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
      expect(stored?._managedFiles).toEqual([
        {
          key: stored?.filename,
          roles: [{ type: 'original' }, { type: 'default' }],
          storageBackendId: `local:${mediaSlug}`,
        },
      ])
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
    expect(after?._managedFiles).toEqual(before?._managedFiles)
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

    expect(copied?._managedFiles?.[0]?.key).not.toBe(created.filename)
    expect(await readFile(path.join(mediaDir, duplicate.filename!))).toEqual(bytes)
    expect(await readFile(path.join(mediaDir, created.filename!))).toEqual(bytes)
  })

  test('should retain a server-staged upload as the saved original', async ({
    payload,
    restClient,
  }) => {
    await payload.create({ collection: 'users', data: devUser, overrideAccess: true })
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
    expect(stored?._managedFiles?.[0]?.roles).toEqual([{ type: 'original' }, { type: 'default' }])
    expect(await readFile(path.join(mediaDir, stored!.filename))).toEqual(bytes)
  })

  test.options(
    'should compensate staged objects when a later hook rejects the upload',
    { db: 'mongo' },
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
    expect(stored?._managedFiles).toHaveLength(3)
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
    expect(
      current._managedFiles?.find((file) => file.key === created.original!.filename)?.roles,
    ).toEqual([{ type: 'original' }, { type: 'default' }])
    expect(await readFile(path.join(transformedMediaDir, resetDoc.filename!))).toEqual(bytes)
    expect(current.variants?.small?.filename).toBe(cropped.variants?.small?.filename)

    const { docs: versions } = await payload.db.findVersions({
      collection: transformedMediaSlug,
      where: { parent: { equals: created.id } },
    })
    const savedCrop = versions.find(({ version }) => version.alt === 'cropped')
    expect(savedCrop).toBeDefined()
    const savedCropKey = savedCrop?.version._managedFiles?.find((file) =>
      file.roles.some((role) => role.type === 'default'),
    )?.key
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
    expect(
      current._managedFiles?.find((file) => file.key === created.original!.filename)?.roles,
    ).toEqual([{ type: 'original' }, { type: 'default' }])
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

  test('should retain trusted original and manifest data in a version snapshot', async ({
    payload,
  }) => {
    const created = await payload.db.create({
      collection: mediaSlug,
      data: {
        _managedFiles: managedFiles,
        alt: 'stored data',
        original: structuredClone(original),
      },
    })

    const updated = await payload.update({
      id: created.id,
      collection: mediaSlug,
      data: {
        _managedFiles: [
          { key: 'forged.jpg', roles: [{ type: 'original' }], storageBackendId: 'other' },
        ],
        alt: 'changed metadata',
        original: { ...original, filename: 'forged.jpg' },
      } as never,
    })

    expect(updated.original).toMatchObject(original)
    expect(updated._managedFiles).toBeUndefined()

    const internal = await payload.findByID({
      id: created.id,
      collection: mediaSlug,
      showHiddenFields: true,
    })

    expect(internal._managedFiles).toEqual(managedFiles)

    const { docs: versions } = await payload.db.findVersions({
      collection: mediaSlug,
      where: { parent: { equals: created.id } },
    })

    expect(versions[0]?.version.original).toMatchObject(original)
    expect(versions[0]?.version._managedFiles).toEqual(managedFiles)
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
      expect(version._managedFiles).toEqual([
        {
          key: archivedName,
          roles: [{ type: 'original' }, { type: 'default' }],
          storageBackendId: `local:${mediaSlug}`,
        },
      ])
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
    expect(baseline?.version._managedFiles).toHaveLength(1)
    expect(await readFile(path.join(mediaDir, baseline!.version.original!.filename))).toEqual(
      firstBytes,
    )
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
      `/${mediaSlug}/file/${selected.version.original!.filename}`,
    )

    expect(historicalResponse.status).toBe(200)
    expect(Buffer.from(await historicalResponse.arrayBuffer()).equals(firstBytes)).toBe(true)

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
    expect(current._fileRevision).toBeTruthy()
    expect(current._fileRevision).not.toBe(selected.version._fileRevision)
    expect(
      (await readFile(path.join(mediaDir, current.original!.filename!))).equals(firstBytes),
    ).toBe(true)
    expect((await readFile(path.join(mediaDir, current.filename!))).equals(firstBytes)).toBe(true)
    expect(current._managedFiles).toEqual([
      {
        key: current.filename,
        roles: [{ type: 'original' }, { type: 'default' }],
        storageBackendId: `local:${mediaSlug}`,
      },
    ])
    expect(after.find(({ id }) => id === selected.id)?.version).toEqual(selected.version)
    expect(after.some(({ version }) => version.alt === 'B')).toBe(true)

    await payload.db.deleteVersions({
      collection: mediaSlug,
      where: { id: { equals: selected.id } },
    })
    const prunedResponse = await restClient.GET(
      `/${mediaSlug}/file/${selected.version.original!.filename}`,
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

  test('should serve a shared original URL without a query parameter', async ({
    payload,
    restClient,
  }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: mediaSlug,
      data: { alt: 'shared raw source' },
      file: { name: 'shared.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const originalURL = new URL(created.original!.url!, 'http://localhost')

    expect(originalURL.searchParams.has('original')).toBe(false)
    expect(created.original?.url).toBe(created.url)
    const response = await restClient.GET(`/${mediaSlug}/file/${created.original!.filename}`)

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
      `/${convertedMediaSlug}/file/${selected.version.filename}`,
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
    expect(current._managedFiles).toHaveLength(2)
  })

  test('should restore saved size bytes after the configured size is removed', async ({
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
    const variants = payload.collections[transformedMediaSlug].config.upload.variants

    payload.collections[transformedMediaSlug].config.upload.variants = []
    try {
      const historical = await restClient.GET(
        `/${transformedMediaSlug}/file/${selected.version.variants!.small!.filename}`,
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
      const savedSize = current._managedFiles?.find(({ roles }) =>
        roles.some((role) => role.type === 'size' && role.sizeKey === 'small'),
      )

      expect(savedSize).toBeDefined()
      expect(
        (await readFile(path.join(transformedMediaDir, savedSize!.key))).equals(firstSize),
      ).toBe(true)
    } finally {
      payload.collections[transformedMediaSlug].config.upload.variants = variants
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

    const currentResponse = await restClient.GET(`/${mediaSlug}/file/${updated.filename}`)
    const archivedResponse = await restClient.GET(
      `/${mediaSlug}/file/${archived.version.original!.filename}`,
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

    await payload.create({ collection: 'users', data: devUser, overrideAccess: true })
    await restClient.login({ slug: 'users', credentials: devUser })

    const authorizedResponse = await restClient.GET(
      `/${mediaSlug}/file/${archived.version.original!.filename}`,
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

    const currentResponse = await restClient.GET(`/${mediaSlug}/file/${updated.filename}`)
    const archivedResponse = await restClient.GET(
      `/${mediaSlug}/file/${archived.version.original!.filename}`,
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

  test('should preserve file revisions through draft, autosave, publish, and unpublish', async ({
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
    { db: 'mongo' },
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
        _managedFiles: [],
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
      const archivedOriginal = firstVersion.version._managedFiles!.find(({ roles }) =>
        roles.some(({ type }) => type === 'original'),
      )!.key

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
        ...current!._managedFiles!.map(({ key }) => key),
        ...versions.flatMap(({ version }) => version._managedFiles?.map(({ key }) => key) ?? []),
      ])

      expect(versions).toHaveLength(105)
      const oldestKey = versions.find(({ version }) => version.alt === 'first')!.version
        ._managedFiles![0]!.key
      const historicalResponse = await restClient.GET(`/${mediaSlug}/file/${oldestKey}`)

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
          _managedFiles: [],
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

  test('should distinguish the same storage key in different backends', async ({ payload }) => {
    const key = 'shared-key.png'
    await mkdir(mediaDir, { recursive: true })
    await writeFile(path.join(mediaDir, key), await readFile(imageFixture))
    await payload.db.create({
      collection: mediaSlug,
      data: {
        _managedFiles: [
          {
            key,
            roles: [{ type: 'original' }],
            storageBackendId: `other:${mediaSlug}`,
          },
        ],
        alt: 'other backend reference',
      },
    })
    const req = await createPayloadRequest({ payload })

    await scheduleUnreferencedFileCleanup({
      candidates: [{ key, roles: [{ type: 'original' }], storageBackendId: `local:${mediaSlug}` }],
      collection: payload.collections[mediaSlug].config,
      req,
    })

    await expect(stat(path.join(mediaDir, key))).rejects.toMatchObject({ code: 'ENOENT' })
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

  test.skipIf(process.env.PAYLOAD_DATABASE === 'sqlite')(
    'should keep files when an outer transaction rolls back a nested delete',
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

  test('should keep files when an afterDelete hook rejects the operation', async ({ payload }) => {
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
    const hasExpectedRollback =
      process.env.PAYLOAD_DATABASE === 'sqlite' ||
      Boolean(
        await payload.db.findOne({ collection: mediaSlug, where: { id: { equals: created.id } } }),
      )

    expect(hasExpectedRollback).toBe(true)
  })

  test('should archive a separately managed thumbnail with its historical version', async ({
    payload,
  }) => {
    const originalBytes = await readFile(imageFixture)
    const thumbnailBytes = await sharp(originalBytes).resize(80, 80).png().toBuffer()
    const replacementBytes = await sharp(originalBytes).flop().png().toBuffer()
    await mkdir(mediaDir, { recursive: true })
    await writeFile(path.join(mediaDir, 'photo.png'), originalBytes)
    await writeFile(path.join(mediaDir, 'photo-thumb.png'), thumbnailBytes)
    const created = await payload.db.create({
      collection: mediaSlug,
      data: {
        _managedFiles: [
          {
            key: 'photo.png',
            roles: [{ type: 'original' }, { type: 'default' }],
            storageBackendId: `local:${mediaSlug}`,
          },
          {
            key: 'photo-thumb.png',
            roles: [{ type: 'thumbnail' }],
            storageBackendId: `local:${mediaSlug}`,
          },
        ],
        alt: 'with thumbnail',
        filename: 'photo.png',
        filesize: originalBytes.length,
        mimeType: 'image/png',
        original: {
          filename: 'photo.png',
          filesize: originalBytes.length,
          mimeType: 'image/png',
          url: `/api/${mediaSlug}/file/photo.png`,
        },
        thumbnailURL: `/api/${mediaSlug}/file/photo-thumb.png`,
        url: `/api/${mediaSlug}/file/photo.png`,
      },
    })

    await payload.update({
      id: created.id,
      collection: mediaSlug,
      data: { alt: 'replaced' },
      file: {
        name: 'replacement.png',
        data: replacementBytes,
        mimetype: 'image/png',
        size: replacementBytes.length,
      },
    })

    const { docs: versions } = await payload.db.findVersions({
      collection: mediaSlug,
      where: { parent: { equals: created.id } },
    })
    const previous = versions.find(({ version }) => version.alt === 'with thumbnail')?.version
    const archivedThumbnail = (
      previous?._managedFiles as Array<{ key: string; roles: Array<{ type: string }> }> | undefined
    )?.find((file) => file.roles.some((role) => role.type === 'thumbnail'))

    expect(archivedThumbnail?.key).not.toBe('photo-thumb.png')
    expect(previous?.thumbnailURL).toContain(path.basename(archivedThumbnail!.key))
    expect(await readFile(path.join(mediaDir, archivedThumbnail!.key))).toEqual(thumbnailBytes)

    const selected = versions.find(({ version }) => version.alt === 'with thumbnail')!
    await payload.restoreVersion({ id: selected.id, collection: mediaSlug })
    const restored = await payload.db.findOne({
      collection: mediaSlug,
      where: { id: { equals: created.id } },
    })
    const restoredThumbnail = restored!._managedFiles!.find(({ roles }) =>
      roles.some(({ type }) => type === 'thumbnail'),
    )!

    expect(await readFile(path.join(mediaDir, restoredThumbnail.key))).toEqual(thumbnailBytes)
    expect(await readFile(path.join(mediaDir, archivedThumbnail!.key))).toEqual(thumbnailBytes)

    await payload.delete({ id: created.id, collection: mediaSlug, overrideAccess: true })

    for (const key of [restoredThumbnail.key, archivedThumbnail!.key]) {
      await expect(stat(path.join(mediaDir, key))).rejects.toMatchObject({ code: 'ENOENT' })
    }
  })

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
    expect(read._managedFiles).toEqual([
      {
        key: 'legacy.png',
        roles: [{ type: 'original' }, { type: 'default' }],
        storageBackendId: `local:${mediaSlug}`,
      },
    ])
    expect(await readdir(mediaDir)).toEqual(filesBeforeRead)

    const stored = await payload.db.findOne({
      collection: mediaSlug,
      where: { id: { equals: legacy.id } },
    })

    expect(stored?.original?.filename).toBeFalsy()
    expect(stored?._managedFiles).toBeFalsy()
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
    expect(read._managedFiles?.[0]?.key).toBe('cropped.png')
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
      docs.map(({ version }) => [version.alt, version._managedFiles]),
    )

    expect(filesByAlt['first A']).toEqual(filesByAlt['second A'])
    expect(filesByAlt['first A']?.[0]?.key).toBe('a.png')
    expect(filesByAlt['first B']?.[0]?.key).toBe('b.png')
    expect(await readdir(mediaDir)).toEqual(filesBeforeRead)

    const storedVersions = await payload.db.findVersions({
      collection: mediaSlug,
      where: { parent: { equals: parent.id } },
    })

    expect(
      storedVersions.docs.every(
        ({ version }) => !version.original?.filename && !version._managedFiles,
      ),
    ).toBe(true)
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
    expect(read._managedFiles).toBeFalsy()
  })
})
