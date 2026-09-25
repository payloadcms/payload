/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { mediaDir, mediaSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const imageFixture = path.resolve(dirname, '../uploads/image.png')

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
