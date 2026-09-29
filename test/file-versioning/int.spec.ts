/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Tests use the shared fixture wrapper. */
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { expect } from 'vitest'

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
      file: { name: 'photo.png', data: bytes, mimetype: 'image/png', size: bytes.length },
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

    expect(stored.original).toMatchObject({
      filename: created.filename,
      filesize: bytes.length,
      mimeType: 'image/png',
    })
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
    expect(await readFile(path.join(mediaDir, created.filename!))).toEqual(bytes)
  })

  test('should retain PDFs and videos without duplicating their source object', async ({
    payload,
  }) => {
    for (const [fixture, mimetype, name] of [
      [pdfFixture, 'application/pdf', 'document.pdf'],
      [videoFixture, 'video/mp4', 'clip.mp4'],
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
    expect(payload.collections[transformedMediaSlug]?.config.upload.imageSizes).toHaveLength(1)
    const created = await payload.create({
      collection: transformedMediaSlug,
      data: { alt: 'source' },
      file: { name: 'landscape.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const originalSizePixels = await sharp(
      path.join(transformedMediaDir, created.sizes!.small!.filename!),
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
    expect(stored?.sizes?.small?.filename).toBeTruthy()
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
      sharp(path.join(transformedMediaDir, stored!.sizes.small.filename)).metadata(),
    ).resolves.toMatchObject({ height: 200, width: 200 })
    expect(
      await sharp(path.join(transformedMediaDir, stored!.sizes.small.filename)).raw().toBuffer(),
    ).toEqual(originalSizePixels)
  })

  test('should keep uploaded bytes when the main representation is converted', async ({
    payload,
  }) => {
    const bytes = await readFile(imageFixture)
    const created = await payload.create({
      collection: convertedMediaSlug,
      data: { alt: 'converted' },
      file: { name: 'convert.png', data: bytes, mimetype: 'image/png', size: bytes.length },
    })
    const stored = await payload.db.findOne({
      collection: convertedMediaSlug,
      where: { id: { equals: created.id } },
    })

    expect(stored?.mimeType).toBe('image/jpeg')
    expect(stored?.original).toMatchObject({ filesize: bytes.length, mimeType: 'image/png' })
    expect(stored?.original?.filename).not.toBe(stored?.filename)
    expect(stored?._managedFiles).toHaveLength(2)
    expect(await readFile(path.join(convertedMediaDir, stored!.original!.filename))).toEqual(bytes)
    await expect(
      sharp(path.join(convertedMediaDir, stored!.filename)).metadata(),
    ).resolves.toMatchObject({ format: 'jpeg' })
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

  test('should retain original and converted output bytes across repeated replacements', async ({
    payload,
  }) => {
    const firstBytes = await readFile(imageFixture)
    const secondBytes = await sharp(firstBytes).flop().png().toBuffer()
    const thirdBytes = await sharp(firstBytes).negate().png().toBuffer()
    const first = await payload.create({
      collection: convertedMediaSlug,
      data: { alt: 'A' },
      file: { name: 'photo.png', data: firstBytes, mimetype: 'image/png', size: firstBytes.length },
    })
    const firstOutput = await readFile(path.join(convertedMediaDir, first.filename!))

    await payload.update({
      id: first.id,
      collection: convertedMediaSlug,
      data: { alt: 'B' },
      file: {
        name: 'photo.png',
        data: secondBytes,
        mimetype: 'image/png',
        size: secondBytes.length,
      },
    })
    await payload.update({
      id: first.id,
      collection: convertedMediaSlug,
      data: { alt: 'C' },
      file: { name: 'photo.png', data: thirdBytes, mimetype: 'image/png', size: thirdBytes.length },
    })

    const { docs: versions } = await payload.db.findVersions({
      collection: convertedMediaSlug,
      limit: 0,
      pagination: false,
      where: { parent: { equals: first.id } },
    })
    const firstVersion = versions.find(({ version }) => version.alt === 'A')?.version
    const secondVersion = versions.find(({ version }) => version.alt === 'B')?.version

    expect(firstVersion?._managedFiles).toHaveLength(2)
    expect(secondVersion?._managedFiles).toHaveLength(2)
    expect(await readFile(path.join(convertedMediaDir, firstVersion!.original!.filename))).toEqual(
      firstBytes,
    )
    expect(await readFile(path.join(convertedMediaDir, firstVersion!.filename))).toEqual(
      firstOutput,
    )
    expect(await readFile(path.join(convertedMediaDir, secondVersion!.original!.filename))).toEqual(
      secondBytes,
    )
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
