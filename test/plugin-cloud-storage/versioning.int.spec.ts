/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Tests use the shared fixture wrapper. */
import type { Payload } from 'payload'

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  unversionedCloudMediaSlug,
  versionedCloudMediaSlug,
  versionedPublicCloudMediaSlug,
} from './shared.js'
import {
  getStoredCloudFiles,
  versionedCloudCalls,
  versionedCloudFailure,
  versionedCloudFiles,
} from './versionedCloudStorage.js'

const firstFile = path.resolve(import.meta.dirname, '../uploads/image.png')
const secondFile = path.resolve(import.meta.dirname, '../uploads/small.png')
const isTransactionalMongoAdapter = (adapter: string) =>
  adapter === 'mongodb' || adapter === 'mongodb-atlas'

const getStoredFiles = async ({
  id,
  collection = versionedCloudMediaSlug,
  payload,
}: {
  collection?: typeof unversionedCloudMediaSlug | typeof versionedCloudMediaSlug
  id: number | string
  payload: Payload
}): Promise<Array<{ key: string; roles: Array<{ type: string }> }>> => {
  const doc = await payload.db.findOne({
    collection,
    where: { id: { equals: id } },
  })
  return getStoredCloudFiles(doc)
}

test.suite('versioned cloud storage', { config: './config.ts' }, () => {
  test.afterEach(() => {
    versionedCloudFiles.clear()
    versionedCloudCalls.afterChanges = 0
    versionedCloudCalls.deletes.length = 0
    versionedCloudCalls.moves = 0
    versionedCloudCalls.uploads = 0
    versionedCloudFailure.afterChange = false
    versionedCloudFailure.beforeCopy = undefined
    versionedCloudFailure.beforeUpload = undefined
    versionedCloudFailure.deleteKey = undefined
    versionedCloudFailure.moveNumber = undefined
    versionedCloudFailure.uploadNumber = 0
  })

  test('should rename a cloud upload by copying its bytes and retaining its history', async ({
    payload,
  }) => {
    const created = await payload.create({
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const before = await getStoredFiles({ id: created.id, payload })
    const oldKey = before[0]!.key
    const bytes = Buffer.from(versionedCloudFiles.get(oldKey)!)
    const renamed = await payload.renameFile({
      id: created.id,
      collection: versionedCloudMediaSlug,
      filename: 'renamed.png',
      overrideAccess: true,
    })
    const after = await getStoredFiles({ id: created.id, payload })

    expect(renamed.filename).toBe('renamed-original.png')
    expect(renamed.url).toContain('/renamed-original.png')
    expect(renamed.storageMarker).toBe(created.storageMarker)
    expect(after[0]!.key).not.toBe(oldKey)
    expect(versionedCloudFiles.get(after[0]!.key)).toEqual(bytes)
    expect(versionedCloudFiles.get(oldKey)).toEqual(bytes)
    expect(versionedCloudCalls.moves).toBe(0)
    const { docs } = await payload.db.findVersions({
      collection: versionedCloudMediaSlug,
      where: { parent: { equals: created.id } },
    })
    expect(docs.some(({ version }) => version.filename === created.filename)).toBe(true)
  })

  test('should store an unversioned upload as one managed original', async ({ payload }) => {
    const created = await payload.create({
      collection: unversionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const files = await getStoredFiles({
      id: created.id,
      collection: unversionedCloudMediaSlug,
      payload,
    })

    expect(created.filename).toBe('image-original.png')
    expect(created.original?.filename).toBe(created.filename)
    expect(created.original?.url).toBe(created.url)
    expect(created._objectKey).toBeUndefined()
    expect(created.original?._objectKey).toBeUndefined()
    expect(files).toEqual([
      {
        key: expect.stringMatching(/image-original\.png$/),
        roles: [{ type: 'original' }, { type: 'default' }],
      },
    ])
    expect([...versionedCloudFiles.keys()]).toEqual([files[0]!.key])
    expect(versionedCloudFiles.get(files[0]!.key)).toEqual(await readFile(firstFile))
    expect(versionedCloudCalls.uploads).toBe(1)
    const stored = await payload.findByID({
      id: created.id,
      collection: unversionedCloudMediaSlug,
      overrideAccess: true,
      showHiddenFields: true,
    })

    expect(stored._objectKey).toBeTruthy()
    expect(stored.original?._objectKey).toBe(stored._objectKey)
  })

  test('should reset a cloud crop to the retained original without another upload', async ({
    payload,
    restClient,
  }) => {
    const sourceBytes = await readFile(firstFile)
    const created = await payload.create({
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const crop = await restClient.PATCH(`/${versionedCloudMediaSlug}/${created.id}`, {
      body: JSON.stringify({}),
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
    const uploadsAfterCrop = versionedCloudCalls.uploads

    const reset = await restClient.PATCH(`/${versionedCloudMediaSlug}/${created.id}`, {
      body: JSON.stringify({}),
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
    const files = await getStoredFiles({ id: created.id, payload })
    const original = files.find((file) => file.roles.some((role) => role.type === 'original'))

    expect(resetDoc.filename).toBe(created.original!.filename)
    expect(resetDoc.url).toBe(created.original!.url)
    expect(original?.roles).toEqual([{ type: 'original' }, { type: 'default' }])
    expect(versionedCloudCalls.uploads).toBe(uploadsAfterCrop)
    expect(versionedCloudFiles.get(original!.key)).toEqual(sourceBytes)

    const { docs: versions } = await payload.db.findVersions({
      collection: versionedCloudMediaSlug,
      where: { parent: { equals: created.id } },
    })
    expect(versions.some(({ version }) => version.filename === cropped.filename)).toBe(true)
  })

  test('should retain the original cloud object when resetting a crop and moving the focal point', async ({
    payload,
    restClient,
  }) => {
    const created = await payload.create({
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
    })
    const crop = await restClient.PATCH(`/${versionedCloudMediaSlug}/${created.id}`, {
      body: JSON.stringify({}),
      query: {
        uploadEdits: {
          crop: { height: 50, unit: '%', width: 50, x: 0, y: 0 },
          heightInPixels: 800,
          widthInPixels: 800,
        },
      },
    })
    expect(crop.status).toBe(200)
    const uploadsAfterCrop = versionedCloudCalls.uploads

    const reset = await restClient.PATCH(`/${versionedCloudMediaSlug}/${created.id}`, {
      body: JSON.stringify({ focalX: 75, focalY: 25 }),
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
    const files = await getStoredFiles({ id: created.id, payload })
    const original = files.find((file) => file.roles.some((role) => role.type === 'original'))

    expect(resetDoc.filename).toBe(created.original!.filename)
    expect(resetDoc.focalX).toBe(75)
    expect(resetDoc.focalY).toBe(25)
    expect(original?.roles).toEqual([{ type: 'original' }, { type: 'default' }])
    expect(versionedCloudCalls.uploads).toBe(uploadsAfterCrop)
  })

  test('should remove an unversioned cloud crop after resetting to the original', async ({
    payload,
    restClient,
  }) => {
    const created = await payload.create({
      collection: unversionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
    })
    const crop = await restClient.PATCH(`/${unversionedCloudMediaSlug}/${created.id}`, {
      body: JSON.stringify({}),
      query: {
        uploadEdits: {
          crop: { height: 50, unit: '%', width: 50, x: 0, y: 0 },
          heightInPixels: 800,
          widthInPixels: 800,
        },
      },
    })
    expect(crop.status).toBe(200)
    const croppedFiles = await getStoredFiles({
      id: created.id,
      collection: unversionedCloudMediaSlug,
      payload,
    })
    const croppedKey = croppedFiles.find((file) =>
      file.roles.some((role) => role.type === 'default'),
    )!.key

    const reset = await restClient.PATCH(`/${unversionedCloudMediaSlug}/${created.id}`, {
      body: JSON.stringify({}),
      query: {
        uploadEdits: {
          crop: { height: 100, unit: '%', width: 100, x: 0, y: 0 },
          heightInPixels: 1600,
          widthInPixels: 1600,
        },
      },
    })
    expect(reset.status).toBe(200)
    expect(versionedCloudFiles.has(croppedKey)).toBe(false)
    expect(versionedCloudFiles.size).toBe(1)
  })

  test('should keep a direct public URL on the retained original after crop reset', async ({
    payload,
    restClient,
  }) => {
    const created = await payload.create({
      collection: versionedPublicCloudMediaSlug,
      data: {},
      filePath: firstFile,
    })
    const originalURL = created.original!.url
    const crop = await restClient.PATCH(`/${versionedPublicCloudMediaSlug}/${created.id}`, {
      body: JSON.stringify({}),
      query: {
        uploadEdits: {
          crop: { height: 50, unit: '%', width: 50, x: 0, y: 0 },
          heightInPixels: 800,
          widthInPixels: 800,
        },
      },
    })
    expect(crop.status).toBe(200)

    const reset = await restClient.PATCH(`/${versionedPublicCloudMediaSlug}/${created.id}`, {
      body: JSON.stringify({}),
      query: {
        uploadEdits: {
          crop: { height: 100, unit: '%', width: 100, x: 0, y: 0 },
          heightInPixels: 1600,
          widthInPixels: 1600,
        },
      },
    })
    expect(reset.status).toBe(200)
    const current = await payload.findByID({
      id: created.id,
      collection: versionedPublicCloudMediaSlug,
    })

    expect(current.url).toBe(originalURL)
    expect(current.original?.url).toBe(originalURL)
  })

  test('should read and replace a legacy cloud file through verified storage state', async ({
    payload,
  }) => {
    const created = await payload.create({
      collection: unversionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const currentKey = [...versionedCloudFiles.keys()][0]!
    const legacyKey = 'legacy.png'
    const bytes = versionedCloudFiles.get(currentKey)!
    versionedCloudFiles.delete(currentKey)
    versionedCloudFiles.set(legacyKey, bytes)
    await payload.db.updateOne({
      collection: unversionedCloudMediaSlug,
      data: {
        _objectKey: null,
        filename: legacyKey,
        original: { filename: null, filesize: null, mimeType: null, url: null },
        url: `/api/${unversionedCloudMediaSlug}/file/${legacyKey}`,
      },
      where: { id: { equals: created.id } },
    })

    const read = await payload.findByID({
      id: created.id,
      collection: unversionedCloudMediaSlug,
      overrideAccess: true,
      showHiddenFields: true,
    })
    const stored = await payload.db.findOne({
      collection: unversionedCloudMediaSlug,
      where: { id: { equals: created.id } },
    })

    expect(read.original?.filename).toBe(legacyKey)
    expect(read.original?.url).toBe(read.url)
    expect(stored?.original?.filename).toBeNull()
    expect(versionedCloudFiles.get(legacyKey)).toEqual(await readFile(firstFile))
    expect(versionedCloudCalls.uploads).toBe(1)
    expect(versionedCloudCalls.deletes).toEqual([])

    const replaced = await payload.update({
      id: created.id,
      collection: unversionedCloudMediaSlug,
      data: {},
      filePath: secondFile,
      overrideAccess: true,
    })
    const persisted = await payload.db.findOne({
      collection: unversionedCloudMediaSlug,
      where: { id: { equals: created.id } },
    })

    expect(replaced.original?.filename).toBe(replaced.filename)
    expect(persisted?.original?.filename).toBe(persisted?.filename)
    expect(versionedCloudFiles.has(legacyKey)).toBe(false)
    expect(versionedCloudFiles.get(getStoredCloudFiles(persisted)[0]!.key)).toEqual(
      await readFile(secondFile),
    )
    expect(versionedCloudCalls.deletes).toContain(legacyKey)
  })

  test('should preserve a verified legacy cloud file in version history on replacement', async ({
    payload,
  }) => {
    const created = await payload.create({
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const newKey = [...versionedCloudFiles.keys()][0]!
    const legacyKey = 'legacy-cropped.png'
    const bytes = await readFile(secondFile)
    versionedCloudFiles.delete(newKey)
    versionedCloudFiles.set(legacyKey, bytes)
    const legacyData = {
      _objectKey: null,
      filename: legacyKey,
      original: { filename: null, filesize: null, mimeType: null, url: null },
      url: `/api/${versionedCloudMediaSlug}/file/${legacyKey}`,
    }
    await payload.db.updateOne({
      collection: versionedCloudMediaSlug,
      data: legacyData,
      where: { id: { equals: created.id } },
    })
    const { docs: versions } = await payload.db.findVersions({
      collection: versionedCloudMediaSlug,
      where: { parent: { equals: created.id } },
    })
    for (const row of versions) {
      await payload.db.updateVersion({
        id: row.id,
        collection: versionedCloudMediaSlug,
        versionData: {
          createdAt: row.createdAt,
          latest: row.latest,
          parent: row.parent,
          updatedAt: row.updatedAt,
          version: { ...row.version, ...legacyData },
        },
      })
    }

    await payload.update({
      id: created.id,
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const { docs: retained } = await payload.db.findVersions({
      collection: versionedCloudMediaSlug,
      where: { parent: { equals: created.id } },
    })
    const legacyVersion = retained.find(({ version }) => version.filename === legacyKey)?.version

    expect(versionedCloudFiles.get(legacyKey)?.equals(bytes)).toBe(true)
    expect(legacyVersion?.original?.filename).toBe(legacyKey)
    expect(getStoredCloudFiles(legacyVersion)[0]?.key).toBe(legacyKey)
  })

  test('should clean up the outgoing unversioned file after replacement', async ({ payload }) => {
    const created = await payload.create({
      collection: unversionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const firstFiles = await getStoredFiles({
      id: created.id,
      collection: unversionedCloudMediaSlug,
      payload,
    })
    const firstKey = firstFiles[0]!.key
    const replaced = await payload.update({
      id: created.id,
      collection: unversionedCloudMediaSlug,
      data: {},
      filePath: secondFile,
      overrideAccess: true,
    })
    const secondFiles = await getStoredFiles({
      id: created.id,
      collection: unversionedCloudMediaSlug,
      payload,
    })

    expect(secondFiles[0]!.key).not.toBe(firstKey)
    expect(replaced.original?.filename).toBe(replaced.filename)
    expect(versionedCloudFiles.get(secondFiles[0]!.key)).toEqual(await readFile(secondFile))
    expect(versionedCloudFiles.has(firstKey)).toBe(false)
    expect(versionedCloudCalls.deletes).toContain(firstKey)
  })

  test('should compensate a staged unversioned upload when the document write fails', async ({
    payload,
  }) => {
    const created = await payload.create({
      collection: unversionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const firstFiles = await getStoredFiles({
      id: created.id,
      collection: unversionedCloudMediaSlug,
      payload,
    })
    const firstKey = firstFiles[0]!.key

    const updateOne = payload.db.updateOne.bind(payload.db)
    const spy = vi.spyOn(payload.db, 'updateOne').mockImplementation(async (args) => {
      if (args.collection === unversionedCloudMediaSlug) {
        throw new Error('Cloud test document write failed')
      }
      return updateOne(args as never)
    })

    try {
      await expect(
        payload.update({
          id: created.id,
          collection: unversionedCloudMediaSlug,
          data: {},
          filePath: secondFile,
          overrideAccess: true,
        }),
      ).rejects.toThrow('Cloud test document write failed')
    } finally {
      spy.mockRestore()
    }

    expect(
      await getStoredFiles({ id: created.id, collection: unversionedCloudMediaSlug, payload }),
    ).toEqual(firstFiles)
    expect([...versionedCloudFiles.keys()]).toEqual([firstKey])
    expect(versionedCloudFiles.get(firstKey)).toEqual(await readFile(firstFile))
    expect(versionedCloudCalls.deletes).toEqual([expect.stringMatching(/small-original\.png$/)])
  })

  test('should delete an unversioned cloud file after removing it from the document', async ({
    payload,
  }) => {
    const created = await payload.create({
      collection: unversionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const key = (
      await getStoredFiles({
        id: created.id,
        collection: unversionedCloudMediaSlug,
        payload,
      })
    )[0]!.key

    await payload.update({
      id: created.id,
      collection: unversionedCloudMediaSlug,
      data: {
        filename: null,
        original: { filename: null, filesize: null, mimeType: null, url: null },
      },
      overrideAccess: true,
    })

    expect(
      await getStoredFiles({ id: created.id, collection: unversionedCloudMediaSlug, payload }),
    ).toEqual([])
    expect(versionedCloudFiles.has(key)).toBe(false)
    expect(versionedCloudCalls.deletes).toContain(key)
  })

  test.options(
    'should use native move for an unversioned rename',
    { db: isTransactionalMongoAdapter },
    async ({ payload }) => {
      const created = await payload.create({
        collection: unversionedCloudMediaSlug,
        data: {},
        filePath: firstFile,
        overrideAccess: true,
      })
      const oldKey = [...versionedCloudFiles.keys()][0]!
      expect(
        payload.collections[unversionedCloudMediaSlug].config.upload.fileOperations?.move,
      ).toBeTypeOf('function')

      const renamed = await payload.renameFile({
        id: created.id,
        collection: unversionedCloudMediaSlug,
        filename: 'moved.png',
        overrideAccess: true,
      })

      expect(renamed.filename).toBe('moved-original.png')
      expect(versionedCloudCalls.moves).toBe(1)
      expect(versionedCloudFiles.has(oldKey)).toBe(false)
      const current = await payload.db.findOne({
        collection: unversionedCloudMediaSlug,
        where: { id: { equals: created.id } },
      })
      expect(versionedCloudFiles.has(getStoredCloudFiles(current)[0]!.key)).toBe(true)
    },
  )

  test.options(
    'should copy an unversioned rename when the database has no transactions',
    { db: (adapter) => adapter === 'sqlite' },
    async ({ payload }) => {
      const created = await payload.create({
        collection: unversionedCloudMediaSlug,
        data: {},
        filePath: firstFile,
        overrideAccess: true,
      })
      const oldKey = (
        await getStoredFiles({ id: created.id, collection: unversionedCloudMediaSlug, payload })
      )[0]!.key

      const renamed = await payload.renameFile({
        id: created.id,
        collection: unversionedCloudMediaSlug,
        filename: 'moved.png',
        overrideAccess: true,
      })
      const newKey = (
        await getStoredFiles({ id: created.id, collection: unversionedCloudMediaSlug, payload })
      )[0]!.key

      expect(renamed.filename).toBe('moved-original.png')
      expect(versionedCloudCalls.moves).toBe(0)
      expect(versionedCloudFiles.has(oldKey)).toBe(false)
      expect(versionedCloudFiles.get(newKey)).toEqual(await readFile(firstFile))
    },
  )

  test.options(
    'should restore earlier objects when a later native move fails',
    { db: isTransactionalMongoAdapter },
    async ({ payload }) => {
      const created = await payload.create({
        collection: unversionedCloudMediaSlug,
        data: {},
        filePath: firstFile,
        overrideAccess: true,
      })
      const originalKey = [...versionedCloudFiles.keys()][0]!
      const processedKey = originalKey.replace(/\.png$/, '-cropped.png')
      versionedCloudFiles.set(processedKey, Buffer.from('cropped'))
      await payload.db.updateOne({
        collection: unversionedCloudMediaSlug,
        data: {
          filename: path.posix.basename(processedKey),
          url: `/api/${unversionedCloudMediaSlug}/file/${path.posix.basename(processedKey)}`,
        },
        where: { id: { equals: created.id } },
      })
      versionedCloudFailure.moveNumber = 2

      await expect(
        payload.renameFile({
          id: created.id,
          collection: unversionedCloudMediaSlug,
          filename: 'later.png',
          overrideAccess: true,
        }),
      ).rejects.toThrow('Cloud test move failed')

      expect(versionedCloudFiles.has(originalKey)).toBe(true)
      expect(versionedCloudFiles.has(processedKey)).toBe(true)
      expect(
        [...versionedCloudFiles.keys()].some((key) => key.endsWith('/later-original.png')),
      ).toBe(false)
      const saved = await payload.db.findOne({
        collection: unversionedCloudMediaSlug,
        where: { id: { equals: created.id } },
      })
      expect(saved?.filename).toBe(path.posix.basename(processedKey))
    },
  )

  test.options(
    'should restore a native move when the database commit fails',
    { db: isTransactionalMongoAdapter },
    async ({ payload }) => {
      const created = await payload.create({
        collection: unversionedCloudMediaSlug,
        data: {},
        filePath: firstFile,
        overrideAccess: true,
      })
      const oldKey = [...versionedCloudFiles.keys()][0]!
      const commitTransaction = payload.db.commitTransaction
      payload.db.commitTransaction = () => Promise.reject(new Error('Cloud test commit failed'))

      try {
        await expect(
          payload.renameFile({
            id: created.id,
            collection: unversionedCloudMediaSlug,
            filename: 'uncommitted.png',
            overrideAccess: true,
          }),
        ).rejects.toThrow('Cloud test commit failed')
      } finally {
        payload.db.commitTransaction = commitTransaction
      }

      expect(versionedCloudFiles.has(oldKey)).toBe(true)
      expect(
        [...versionedCloudFiles.keys()].some((key) => key.endsWith('/uncommitted-original.png')),
      ).toBe(false)
      const saved = await payload.db.findOne({
        collection: unversionedCloudMediaSlug,
        where: { id: { equals: created.id } },
      })
      expect(saved?.filename).toBe(created.filename)
    },
  )

  test('should copy then remove the source when an unversioned adapter has no native move', async ({
    payload,
  }) => {
    const created = await payload.create({
      collection: unversionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const oldKey = [...versionedCloudFiles.keys()][0]!
    const bytes = Buffer.from(versionedCloudFiles.get(oldKey)!)
    const operations = payload.collections[unversionedCloudMediaSlug].config.upload.fileOperations!
    const move = operations.move
    operations.move = undefined

    try {
      const renamed = await payload.renameFile({
        id: created.id,
        collection: unversionedCloudMediaSlug,
        filename: 'copied.png',
        overrideAccess: true,
      })
      const after = await payload.db.findOne({
        collection: unversionedCloudMediaSlug,
        where: { id: { equals: created.id } },
      })

      expect(renamed.filename).toBe('copied-original.png')
      expect(versionedCloudCalls.moves).toBe(0)
      expect(versionedCloudFiles.has(oldKey)).toBe(false)
      expect(versionedCloudFiles.get(getStoredCloudFiles(after)[0]!.key)).toEqual(bytes)
    } finally {
      operations.move = move
    }
  })

  test('should retain the source when fallback copy fails', async ({ payload }) => {
    const created = await payload.create({
      collection: unversionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const oldKey = [...versionedCloudFiles.keys()][0]!
    const operations = payload.collections[unversionedCloudMediaSlug].config.upload.fileOperations!
    const move = operations.move
    operations.move = undefined
    versionedCloudFailure.beforeCopy = () => Promise.reject(new Error('Cloud copy failed'))

    try {
      await expect(
        payload.renameFile({
          id: created.id,
          collection: unversionedCloudMediaSlug,
          filename: 'failed.png',
          overrideAccess: true,
        }),
      ).rejects.toThrow('Cloud copy failed')

      expect(versionedCloudFiles.has(oldKey)).toBe(true)
      expect(versionedCloudCalls.deletes).not.toContain(oldKey)
    } finally {
      operations.move = move
    }
  })

  test('should not treat a custom legacy URL as an owned cloud object', async ({ payload }) => {
    const created = await payload.create({
      collection: unversionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const oldKey = [...versionedCloudFiles.keys()][0]!
    await payload.db.updateOne({
      collection: unversionedCloudMediaSlug,
      data: {
        original: { filename: null, filesize: null, mimeType: null, url: null },
        url: 'https://external.example.test/image.png',
      },
      where: { id: { equals: created.id } },
    })

    const read = await payload.findByID({
      id: created.id,
      collection: unversionedCloudMediaSlug,
      overrideAccess: true,
      showHiddenFields: true,
    })

    expect(read.original?.filename).toBeNull()

    await expect(
      payload.renameFile({
        id: created.id,
        collection: unversionedCloudMediaSlug,
        filename: 'untrusted.png',
        overrideAccess: true,
      }),
    ).rejects.toThrow('no managed files')

    expect(versionedCloudFiles.has(oldKey)).toBe(true)
    expect(versionedCloudCalls.moves).toBe(0)
  })

  test('should reject rename when the configured adapter lacks safe copy', async ({ payload }) => {
    const created = await payload.create({
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const operations = payload.collections[versionedCloudMediaSlug].config.upload.fileOperations!
    const copy = operations.copy
    operations.copy = undefined as never

    try {
      await expect(
        payload.renameFile({
          id: created.id,
          collection: versionedCloudMediaSlug,
          filename: 'renamed.png',
          overrideAccess: true,
        }),
      ).rejects.toThrow('No safe copy operation')
    } finally {
      operations.copy = copy
    }
  })

  test('should reject a cloud destination collision without changing either object', async ({
    payload,
  }) => {
    const created = await payload.create({
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const current = (await getStoredFiles({ id: created.id, payload }))[0]!.key
    const destination = current.replace(/[^/]+$/, 'occupied-original.png')
    const occupiedBytes = Buffer.from('another file')
    versionedCloudFiles.set(destination, occupiedBytes)

    await expect(
      payload.renameFile({
        id: created.id,
        collection: versionedCloudMediaSlug,
        filename: 'occupied.png',
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ status: 409 })

    expect(versionedCloudFiles.get(destination)).toEqual(occupiedBytes)
    expect((await getStoredFiles({ id: created.id, payload }))[0]?.key).toBe(current)
  })

  test('should retain the original object and earlier bytes across a replacement', async ({
    payload,
  }) => {
    const first = await payload.create({
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const firstFiles = await getStoredFiles({ id: first.id, payload })
    const firstKey = firstFiles[0]!.key
    const firstBytes = Buffer.from(versionedCloudFiles.get(firstKey)!)

    expect(firstFiles[0]?.roles).toEqual(
      expect.arrayContaining([{ type: 'original' }, { type: 'default' }]),
    )
    expect(versionedCloudCalls.uploads).toBe(1)
    expect(versionedCloudCalls.afterChanges).toBe(2)

    const second = await payload.update({
      id: first.id,
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: secondFile,
      overrideAccess: true,
    })

    const secondFiles = await getStoredFiles({ id: second.id, payload })

    expect(secondFiles[0]?.key).not.toBe(firstKey)
    expect(versionedCloudFiles.get(firstKey)).toEqual(firstBytes)
    expect(versionedCloudFiles.get(secondFiles[0]!.key)).toBeTruthy()
    expect(versionedCloudCalls.deletes).toEqual([])
    expect(versionedCloudCalls.uploads).toBe(2)
    expect(versionedCloudCalls.afterChanges).toBe(4)
    expect(second.storageMarker).toBe(secondFiles[0]!.key)
    const saved = await payload.db.findOne({
      collection: versionedCloudMediaSlug,
      where: { id: { equals: first.id } },
    })
    expect(saved?.storageMarker).toBe(secondFiles[0]!.key)

    const { docs } = await payload.db.findVersions({
      collection: versionedCloudMediaSlug,
      limit: 10,
      where: { parent: { equals: first.id } },
    })
    expect(
      docs.some(({ version }) => getStoredCloudFiles(version).some(({ key }) => key === firstKey)),
    ).toBe(true)
  })

  test('should delete a cloud object after its last version is pruned', async ({ payload }) => {
    const collection = payload.collections[versionedCloudMediaSlug].config
    const previousVersions = collection.versions
    collection.versions = { ...previousVersions, maxPerDoc: 3 }

    try {
      const first = await payload.create({
        collection: versionedCloudMediaSlug,
        data: { storageMarker: 'first' },
        filePath: firstFile,
        overrideAccess: true,
      })
      const firstKey = (await getStoredFiles({ id: first.id, payload }))[0]!.key

      await payload.update({
        id: first.id,
        collection: versionedCloudMediaSlug,
        data: { storageMarker: 'second' },
        filePath: secondFile,
        overrideAccess: true,
      })

      for (let revision = 3; revision <= 5; revision++) {
        await payload.update({
          id: first.id,
          collection: versionedCloudMediaSlug,
          data: { storageMarker: `revision-${revision}` },
          overrideAccess: true,
        })
      }

      const { docs: retained } = await payload.db.findVersions({
        collection: versionedCloudMediaSlug,
        pagination: false,
        where: { parent: { equals: first.id } },
      })

      expect(retained).toHaveLength(3)
      expect(
        retained.some(({ version }) =>
          getStoredCloudFiles(version).some(({ key }) => key === firstKey),
        ),
      ).toBe(false)
      expect(versionedCloudCalls.deletes).toContain(firstKey)
      expect(versionedCloudFiles.has(firstKey)).toBe(false)
      expect((await getStoredFiles({ id: first.id, payload }))[0]?.key).toBeTruthy()
    } finally {
      collection.versions = previousVersions
    }
  })

  test('should restore a prior cloud object into a new current key', async ({
    payload,
    restClient,
  }) => {
    const first = await payload.create({
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
    })
    const firstFiles = await getStoredFiles({ id: first.id, payload })
    const firstBytes = Buffer.from(versionedCloudFiles.get(firstFiles[0]!.key)!)

    await payload.update({
      id: first.id,
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: secondFile,
    })
    const { docs: before } = await payload.db.findVersions({
      collection: versionedCloudMediaSlug,
      pagination: false,
      where: { parent: { equals: first.id } },
    })
    const selected = before.find(({ version }) =>
      getStoredCloudFiles(version).some(({ key }) => key === firstFiles[0]!.key),
    )!
    const selectedRead = await payload.findVersionByID({
      id: selected.id,
      collection: versionedCloudMediaSlug,
      overrideAccess: false,
    })
    const historicalURL = new URL(selectedRead.version.original!.url!, 'http://localhost')
    const historicalResponse = await restClient.GET(
      `${historicalURL.pathname.replace(/^\/api/, '')}${historicalURL.search}`,
    )

    expect(historicalURL.searchParams.get('version')).toBe(String(selected.id))
    expect(historicalResponse.status).toBe(200)
    expect(Buffer.from(await historicalResponse.arrayBuffer()).equals(firstBytes)).toBe(true)

    await payload.restoreVersion({
      id: selected.id,
      collection: versionedCloudMediaSlug,
      overrideAccess: false,
    })

    const currentFiles = await getStoredFiles({ id: first.id, payload })
    const { docs: after } = await payload.db.findVersions({
      collection: versionedCloudMediaSlug,
      pagination: false,
      where: { parent: { equals: first.id } },
    })

    expect(currentFiles[0]!.key).not.toBe(firstFiles[0]!.key)
    expect(versionedCloudFiles.get(currentFiles[0]!.key)).toEqual(firstBytes)
    expect(after.find(({ id }) => id === selected.id)?.version).toEqual(selected.version)
  })

  test('should retain a failed cloud deletion and log its exact storage key', async ({
    payload,
  }) => {
    const first = await payload.create({
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
    })
    const firstKey = (await getStoredFiles({ id: first.id, payload }))[0]!.key

    await payload.update({
      id: first.id,
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: secondFile,
    })
    const currentKey = (await getStoredFiles({ id: first.id, payload }))[0]!.key
    const logged = vi.spyOn(payload.logger, 'error')
    versionedCloudFailure.deleteKey = firstKey

    try {
      await payload.delete({ id: first.id, collection: versionedCloudMediaSlug })

      expect(versionedCloudFiles.has(firstKey)).toBe(true)
      expect(versionedCloudFiles.has(currentKey)).toBe(false)
      expect(versionedCloudCalls.deletes).toContain(firstKey)
      expect(logged).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: expect.stringContaining(firstKey),
        }),
      )
    } finally {
      logged.mockRestore()
    }
  })

  test('should keep authorized public provider URLs direct across history and restore', async ({
    payload,
  }) => {
    const first = await payload.create({
      collection: versionedPublicCloudMediaSlug,
      data: {},
      filePath: firstFile,
    })
    const firstStored = await payload.db.findOne({
      collection: versionedPublicCloudMediaSlug,
      where: { id: { equals: first.id } },
    })
    const firstKey = getStoredCloudFiles(firstStored)[0]?.key

    await payload.update({
      id: first.id,
      collection: versionedPublicCloudMediaSlug,
      data: {},
      filePath: secondFile,
    })
    const { docs } = await payload.db.findVersions({
      collection: versionedPublicCloudMediaSlug,
      pagination: false,
      where: { parent: { equals: first.id } },
    })
    const selected = docs.find(({ version }) =>
      getStoredCloudFiles(version).some(({ key }) => key === firstKey),
    )!
    const historical = await payload.findVersionByID({
      id: selected.id,
      collection: versionedPublicCloudMediaSlug,
      overrideAccess: false,
    })

    expect(historical.version.original?.url).toMatch(/^https:\/\/files\.example\.test\//)

    await payload.restoreVersion({
      id: selected.id,
      collection: versionedPublicCloudMediaSlug,
      overrideAccess: false,
    })
    const current = await payload.findByID({
      id: first.id,
      collection: versionedPublicCloudMediaSlug,
    })

    expect(current.original?.url).toMatch(/^https:\/\/files\.example\.test\//)
    expect(current.url).toMatch(/^https:\/\/files\.example\.test\//)
  })

  test('should remove staged cloud bytes when an upload fails', async ({ payload }) => {
    const first = await payload.create({
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const firstKey = (await getStoredFiles({ id: first.id, payload }))[0]!.key
    const originalKeys = [...versionedCloudFiles.keys()]

    versionedCloudFailure.uploadNumber = versionedCloudCalls.uploads + 1
    await expect(
      payload.update({
        id: first.id,
        collection: versionedCloudMediaSlug,
        data: {},
        filePath: secondFile,
        overrideAccess: true,
      }),
    ).rejects.toThrow('Cloud test upload failed')

    expect((await getStoredFiles({ id: first.id, payload }))[0]?.key).toBe(firstKey)
    expect([...versionedCloudFiles.keys()]).toEqual(originalKeys)
  })

  test.options(
    'should remove staged cloud bytes when a later hook fails with a transaction',
    { db: isTransactionalMongoAdapter },
    async ({ payload }) => {
      const first = await payload.create({
        collection: versionedCloudMediaSlug,
        data: {},
        filePath: firstFile,
        overrideAccess: true,
      })
      const firstKey = (await getStoredFiles({ id: first.id, payload }))[0]!.key
      const originalKeys = [...versionedCloudFiles.keys()]

      versionedCloudFailure.afterChange = true
      await expect(
        payload.update({
          id: first.id,
          collection: versionedCloudMediaSlug,
          data: {},
          filePath: secondFile,
          overrideAccess: true,
        }),
      ).rejects.toThrow('Cloud test afterChange failed')

      const current = await payload.findByID({
        id: first.id,
        collection: versionedCloudMediaSlug,
        overrideAccess: true,
      })
      expect((await getStoredFiles({ id: current.id, payload }))[0]?.key).toBe(firstKey)
      expect([...versionedCloudFiles.keys()]).toEqual(originalKeys)
      expect(versionedCloudCalls.deletes).not.toContain(firstKey)
    },
  )

  test.options(
    'should retain the saved cloud file when a hook fails without a transaction',
    { db: (adapter) => adapter === 'sqlite' },
    async ({ payload }) => {
      const first = await payload.create({
        collection: versionedCloudMediaSlug,
        data: {},
        filePath: firstFile,
        overrideAccess: true,
      })
      const firstKey = (await getStoredFiles({ id: first.id, payload }))[0]!.key
      versionedCloudFailure.afterChange = true

      await expect(
        payload.update({
          id: first.id,
          collection: versionedCloudMediaSlug,
          data: {},
          filePath: secondFile,
          overrideAccess: true,
        }),
      ).rejects.toThrow('Cloud test afterChange failed')

      const currentKey = (await getStoredFiles({ id: first.id, payload }))[0]!.key

      expect(currentKey).not.toBe(firstKey)
      expect(versionedCloudFiles.get(currentKey)).toEqual(await readFile(secondFile))
      expect(versionedCloudFiles.get(firstKey)).toEqual(await readFile(firstFile))
    },
  )

  test('should keep published bytes when saving a draft replacement', async ({ payload }) => {
    const published = await payload.create({
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const publishedKey = (await getStoredFiles({ id: published.id, payload }))[0]!.key

    const draft = await payload.update({
      id: published.id,
      collection: versionedCloudMediaSlug,
      data: {},
      draft: true,
      filePath: secondFile,
      overrideAccess: true,
    })

    const draftWithHidden = await payload.findByID({
      id: draft.id,
      collection: versionedCloudMediaSlug,
      draft: true,
      overrideAccess: true,
      showHiddenFields: true,
    })
    expect(getStoredCloudFiles(draftWithHidden)[0]?.key).not.toBe(publishedKey)
    expect(versionedCloudFiles.has(publishedKey)).toBe(true)
    expect(versionedCloudCalls.deletes).toEqual([])

    const current = await payload.findByID({
      id: published.id,
      collection: versionedCloudMediaSlug,
      overrideAccess: true,
    })
    expect((await getStoredFiles({ id: current.id, payload }))[0]?.key).toBe(publishedKey)
  })

  test.options(
    'should remove staged cloud bytes when the document write fails',
    { db: isTransactionalMongoAdapter },
    async ({ payload }) => {
      const first = await payload.create({
        collection: versionedCloudMediaSlug,
        data: {},
        filePath: firstFile,
        overrideAccess: true,
      })
      const firstKey = (await getStoredFiles({ id: first.id, payload }))[0]!.key
      const originalKeys = [...versionedCloudFiles.keys()]
      const updateOne = payload.db.updateOne.bind(payload.db)
      const spy = vi.spyOn(payload.db, 'updateOne').mockImplementation(async (args) => {
        if (args.collection === versionedCloudMediaSlug && 'filename' in args.data) {
          throw new Error('Cloud test document write failed')
        }
        return updateOne(args as never)
      })

      try {
        await expect(
          payload.update({
            id: first.id,
            collection: versionedCloudMediaSlug,
            data: {},
            filePath: secondFile,
            overrideAccess: true,
          }),
        ).rejects.toThrow('Cloud test document write failed')
      } finally {
        spy.mockRestore()
      }

      expect((await getStoredFiles({ id: first.id, payload }))[0]?.key).toBe(firstKey)
      expect([...versionedCloudFiles.keys()]).toEqual(originalKeys)
      expect(versionedCloudCalls.deletes).not.toContain(firstKey)
    },
  )

  test.options(
    'should retain the current cloud file when a document write fails without a transaction',
    { db: (adapter) => adapter === 'sqlite' },
    async ({ payload }) => {
      const first = await payload.create({
        collection: versionedCloudMediaSlug,
        data: {},
        filePath: firstFile,
        overrideAccess: true,
      })
      const firstKey = (await getStoredFiles({ id: first.id, payload }))[0]!.key
      const updateOne = payload.db.updateOne.bind(payload.db)
      const spy = vi.spyOn(payload.db, 'updateOne').mockImplementation(async (args) => {
        if (args.collection === versionedCloudMediaSlug && 'filename' in args.data) {
          throw new Error('Cloud test document write failed')
        }
        return updateOne(args as never)
      })

      try {
        await expect(
          payload.update({
            id: first.id,
            collection: versionedCloudMediaSlug,
            data: {},
            filePath: secondFile,
            overrideAccess: true,
          }),
        ).rejects.toThrow('Cloud test document write failed')
      } finally {
        spy.mockRestore()
      }

      expect((await getStoredFiles({ id: first.id, payload }))[0]?.key).toBe(firstKey)
      expect(versionedCloudFiles.get(firstKey)).toEqual(await readFile(firstFile))
      expect(versionedCloudCalls.deletes).not.toContain(firstKey)
    },
  )

  test('should give repeated writes with the same filename distinct objects', async ({
    payload,
  }) => {
    const first = await payload.create({
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const firstKey = (await getStoredFiles({ id: first.id, payload }))[0]!.key

    await payload.update({
      id: first.id,
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
      overwriteExistingFiles: true,
    })
    const secondKey = (await getStoredFiles({ id: first.id, payload }))[0]!.key

    await payload.update({
      id: first.id,
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
      overwriteExistingFiles: true,
    })
    const thirdKey = (await getStoredFiles({ id: first.id, payload }))[0]!.key

    expect(new Set([firstKey, secondKey, thirdKey]).size).toBe(3)
    expect([firstKey, secondKey, thirdKey].every((key) => versionedCloudFiles.has(key))).toBe(true)
    expect(versionedCloudCalls.uploads).toBe(3)
    expect(versionedCloudCalls.deletes).toEqual([])
  })
})
