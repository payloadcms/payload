/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Tests use the shared fixture wrapper. */
import type { Payload } from 'payload'

import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { createPayloadRequest } from 'payload'
import { expect, vi } from 'vitest'

/* eslint-disable payload/no-relative-monorepo-imports -- Exercise the internal cleanup lifecycle against saved documents and versions. */
import { scheduleUnreferencedFileCleanup } from '../../packages/payload/src/uploads/fileVersioning/cleanup.js'
/* eslint-enable payload/no-relative-monorepo-imports */
import { test } from '../__helpers/int/vitest.js'
import {
  mediaWithDisabledPluginSlug,
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
    versionedCloudFailure.uploadNumber = 0
  })

  for (const operation of ['create', 'update'] as const) {
    test(`should preserve outer cloud metadata through a nested ${operation}`, async ({
      payload,
    }) => {
      const bytes = await readFile(firstFile)
      const nestedBytes = await readFile(secondFile)
      const existing =
        operation === 'update'
          ? await Promise.all([
              payload.create({
                collection: versionedCloudMediaSlug,
                data: {},
                filePath: firstFile,
                overrideAccess: true,
              }),
              payload.create({
                collection: versionedCloudMediaSlug,
                data: {},
                filePath: secondFile,
                overrideAccess: true,
              }),
            ])
          : undefined
      const uploadsBefore = versionedCloudCalls.uploads
      const req = await createPayloadRequest({
        context:
          operation === 'update'
            ? {
                _payloadManagedCloudMetadata: undefined,
                _payloadManagedCloudStorage: undefined,
              }
            : {},
        payload,
      })
      const hooks = payload.collections[versionedCloudMediaSlug].config.hooks
      const afterChange = hooks.afterChange
      let nested: { id: number | string; storageMarker?: null | string } | undefined
      hooks.afterChange = [
        async ({ doc, req: hookReq }) => {
          if (doc.filename !== 'outer-original.png' || hookReq.context.skipCloudStorage) {
            return
          }
          expect(hookReq).toBe(req)
          expect(hookReq.context._payloadManagedCloudStorage).toBe(true)
          const metadata = hookReq.context._payloadManagedCloudMetadata
          expect(metadata).toMatchObject({ storageMarker: doc.storageMarker })
          const args = {
            collection: versionedCloudMediaSlug,
            data: {},
            file: {
              name: 'nested.png',
              data: nestedBytes,
              mimetype: 'image/png',
              size: nestedBytes.length,
            },
            overrideAccess: true,
            req: hookReq,
          }
          nested =
            operation === 'create'
              ? await payload.create(args)
              : await payload.update({ ...args, id: existing![1].id })
          expect(hookReq.context._payloadManagedCloudStorage).toBe(true)
          expect(hookReq.context._payloadManagedCloudMetadata).toBe(metadata)
        },
        ...afterChange,
      ]

      try {
        const args = {
          collection: versionedCloudMediaSlug,
          data: {},
          file: { name: 'outer.png', data: bytes, mimetype: 'image/png', size: bytes.length },
          overrideAccess: true,
          req,
        }
        const outer =
          operation === 'create'
            ? await payload.create(args)
            : await payload.update({ ...args, id: existing![0].id })
        expect(nested).toBeDefined()
        const outerKey = (await getStoredFiles({ id: outer.id, payload }))[0]!.key
        const nestedKey = (await getStoredFiles({ id: nested!.id, payload }))[0]!.key
        expect(outerKey).not.toBe(nestedKey)
        expect(outer.storageMarker).toBe(outerKey)
        expect(nested!.storageMarker).toBe(nestedKey)
        const savedOuter = await payload.db.findOne({
          collection: versionedCloudMediaSlug,
          where: { id: { equals: outer.id } },
        })
        const savedNested = await payload.db.findOne({
          collection: versionedCloudMediaSlug,
          where: { id: { equals: nested!.id } },
        })
        expect(savedOuter?.storageMarker).toBe(outerKey)
        expect(savedNested?.storageMarker).toBe(nestedKey)
        expect(versionedCloudFiles.get(outerKey)).toEqual(bytes)
        expect(versionedCloudFiles.get(nestedKey)).toEqual(nestedBytes)
        expect(versionedCloudCalls.uploads).toBe(uploadsBefore + 2)
        expect(Object.hasOwn(req.context, '_payloadManagedCloudStorage')).toBe(
          operation === 'update',
        )
        expect(Object.hasOwn(req.context, '_payloadManagedCloudMetadata')).toBe(
          operation === 'update',
        )
        expect(req.context._payloadManagedCloudStorage).toBeUndefined()
        expect(req.context._payloadManagedCloudMetadata).toBeUndefined()
      } finally {
        hooks.afterChange = afterChange
      }
    })
  }

  for (const nestedOperation of ['failed create', 'failed update', 'local create'] as const) {
    test(`should preserve the cloud guard after a nested ${nestedOperation}`, async ({
      payload,
    }) => {
      const bytes = await readFile(firstFile)
      const nestedBytes = await readFile(secondFile)
      const existing =
        nestedOperation === 'failed update'
          ? await payload.create({
              collection: versionedCloudMediaSlug,
              data: {},
              filePath: secondFile,
              overrideAccess: true,
            })
          : undefined
      const uploadsBefore = versionedCloudCalls.uploads
      const req = await createPayloadRequest({ payload })
      const hooks = payload.collections[versionedCloudMediaSlug].config.hooks
      const afterChange = hooks.afterChange
      const localFiles: string[] = []
      let hasCheckedNestedOperation = false
      hooks.afterChange = [
        async ({ doc, req: hookReq }) => {
          if (hookReq.context.skipCloudStorage) {
            return
          }
          if (doc.filename === 'nested-failed-original.png') {
            throw new Error('Nested cloud hook failed')
          }
          if (doc.filename !== 'outer-original.png') {
            return
          }
          const metadata = hookReq.context._payloadManagedCloudMetadata
          expect(hookReq.context._payloadManagedCloudStorage).toBe(true)
          const args = {
            collection: versionedCloudMediaSlug,
            data: {},
            disableTransaction: true,
            file: {
              name: 'nested-failed.png',
              data: nestedBytes,
              mimetype: 'image/png',
              size: nestedBytes.length,
            },
            overrideAccess: true,
            req: hookReq,
          }
          let nestedError: unknown

          if (nestedOperation === 'local create') {
            const local = await payload.create({ ...args, collection: mediaWithDisabledPluginSlug })
            const staticDir =
              payload.collections[mediaWithDisabledPluginSlug].config.upload.staticDir
            localFiles.push(
              ...getStoredCloudFiles(local).map(({ key }) => path.join(staticDir, key)),
            )
          } else {
            try {
              await (nestedOperation === 'failed create'
                ? payload.create(args)
                : payload.update({ ...args, id: existing!.id }))
            } catch (error) {
              nestedError = error
            }
          }
          expect(nestedError).toEqual(
            nestedOperation === 'local create' ? undefined : new Error('Nested cloud hook failed'),
          )
          expect(hookReq.context._payloadManagedCloudStorage).toBe(true)
          expect(hookReq.context._payloadManagedCloudMetadata).toBe(metadata)
          hasCheckedNestedOperation = true
        },
        ...afterChange,
      ]

      try {
        const outer = await payload.create({
          collection: versionedCloudMediaSlug,
          data: {},
          disableTransaction: true,
          file: { name: 'outer.png', data: bytes, mimetype: 'image/png', size: bytes.length },
          overrideAccess: true,
          req,
        })
        const key = (await getStoredFiles({ id: outer.id, payload }))[0]!.key
        expect(hasCheckedNestedOperation).toBe(true)
        expect(outer.storageMarker).toBe(key)
        expect(versionedCloudFiles.get(key)).toEqual(bytes)
        expect(versionedCloudCalls.uploads).toBe(
          uploadsBefore + (nestedOperation === 'local create' ? 1 : 2),
        )
        expect(Object.hasOwn(req.context, '_payloadManagedCloudStorage')).toBe(false)
        expect(Object.hasOwn(req.context, '_payloadManagedCloudMetadata')).toBe(false)
      } finally {
        hooks.afterChange = afterChange
        await Promise.all(localFiles.map((file) => rm(file, { force: true })))
      }
    })
  }

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
    'should keep unversioned cloud sources readable until the rename commits',
    { db: isTransactionalMongoAdapter },
    async ({ payload }) => {
      const created = await payload.create({
        collection: unversionedCloudMediaSlug,
        data: {},
        filePath: firstFile,
        overrideAccess: true,
      })
      const oldKey = [...versionedCloudFiles.keys()][0]!
      const bytes = Buffer.from(versionedCloudFiles.get(oldKey)!)
      const newKey = path.posix.join(path.posix.dirname(oldKey), 'moved-original.png')
      const commitTransaction = payload.db.commitTransaction
      let hasCheckedPendingRename = false

      payload.db.commitTransaction = async (transactionID) => {
        const current = await payload.db.findOne({
          collection: unversionedCloudMediaSlug,
          where: { id: { equals: created.id } },
        })

        expect(current?.filename).toBe(created.filename)
        expect(versionedCloudFiles.get(oldKey)).toEqual(bytes)
        expect(versionedCloudFiles.get(newKey)).toEqual(bytes)
        hasCheckedPendingRename = true
        return commitTransaction.call(payload.db, transactionID)
      }

      try {
        const renamed = await payload.renameFile({
          id: created.id,
          collection: unversionedCloudMediaSlug,
          filename: 'moved.png',
          overrideAccess: true,
        })

        expect(renamed.filename).toBe('moved-original.png')
        expect(hasCheckedPendingRename).toBe(true)
        expect(versionedCloudCalls.moves).toBe(0)
        expect(versionedCloudFiles.has(oldKey)).toBe(false)
        expect(versionedCloudFiles.get(newKey)).toEqual(bytes)
      } finally {
        payload.db.commitTransaction = commitTransaction
      }
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

  test('should retain all cloud sources when a later rename destination is occupied', async ({
    payload,
  }) => {
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
    const oldStem = path.posix.parse(originalKey).name.replace(/-original$/, '')
    const collisionKey = path.posix.join(
      path.posix.dirname(processedKey),
      path.posix.basename(processedKey).replace(oldStem, 'later'),
    )
    const occupiedBytes = Buffer.from('occupied')
    versionedCloudFiles.set(collisionKey, occupiedBytes)

    await expect(
      payload.renameFile({
        id: created.id,
        collection: unversionedCloudMediaSlug,
        filename: 'later.png',
        overrideAccess: true,
      }),
    ).rejects.toThrow('already exists')

    expect(versionedCloudFiles.get(collisionKey)).toEqual(occupiedBytes)
    expect(versionedCloudFiles.get(originalKey)).toEqual(await readFile(firstFile))
    expect(versionedCloudCalls.moves).toBe(0)
    expect(versionedCloudFiles.has(processedKey)).toBe(true)
    expect([...versionedCloudFiles.keys()].some((key) => key.endsWith('/later-original.png'))).toBe(
      false,
    )
    const saved = await payload.db.findOne({
      collection: unversionedCloudMediaSlug,
      where: { id: { equals: created.id } },
    })
    expect(saved?.filename).toBe(path.posix.basename(processedKey))
  })

  test.options(
    'should retain cloud sources and remove new copies when the rename commit fails',
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
      payload.db.commitTransaction = async () => {
        expect(versionedCloudFiles.get(oldKey)).toEqual(await readFile(firstFile))
        expect(
          versionedCloudFiles.get(
            path.posix.join(path.posix.dirname(oldKey), 'uncommitted-original.png'),
          ),
        ).toEqual(await readFile(firstFile))
        throw new Error('Cloud test commit failed')
      }

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

  test('should retain the source when a cloud rename copy fails', async ({ payload }) => {
    const created = await payload.create({
      collection: unversionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const oldKey = [...versionedCloudFiles.keys()][0]!
    versionedCloudFailure.beforeCopy = () => Promise.reject(new Error('Cloud copy failed'))

    await expect(
      payload.renameFile({
        id: created.id,
        collection: unversionedCloudMediaSlug,
        filename: 'failed.png',
        overrideAccess: true,
      }),
    ).rejects.toThrow('Cloud copy failed')

    expect(versionedCloudFiles.get(oldKey)).toEqual(await readFile(firstFile))
    expect(versionedCloudCalls.moves).toBe(0)
    expect(versionedCloudCalls.deletes).not.toContain(oldKey)
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

  test('should pass the saved document when deleting a legacy cloud upload', async ({
    payload,
  }) => {
    const created = await payload.create({
      collection: unversionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const uploadedKey = [...versionedCloudFiles.keys()][0]!
    const legacyKey = 'legacy.png'

    versionedCloudFiles.set(legacyKey, versionedCloudFiles.get(uploadedKey)!)
    versionedCloudFiles.delete(uploadedKey)

    await payload.db.updateOne({
      collection: unversionedCloudMediaSlug,
      data: {
        _objectKey: null,
        filename: legacyKey,
        original: {
          _objectKey: null,
          filename: null,
          filesize: null,
          height: null,
          mimeType: null,
          prefix: null,
          url: null,
          width: null,
        },
        url: 'https://external.example.test/legacy.png',
      },
      where: { id: { equals: created.id } },
    })

    await payload.delete({
      id: created.id,
      collection: unversionedCloudMediaSlug,
      overrideAccess: true,
    })

    expect(versionedCloudFiles.has(legacyKey)).toBe(false)
    expect(versionedCloudCalls.deletes).toEqual([legacyKey])
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

    const bareResponse = await restClient.GET(historicalURL.pathname.replace(/^\/api/, ''))
    const wrongPrefix = new URL(historicalURL)
    wrongPrefix.searchParams.set('prefix', 'another-folder')
    const wrongPrefixResponse = await restClient.GET(
      `${wrongPrefix.pathname.replace(/^\/api/, '')}${wrongPrefix.search}`,
    )

    expect(bareResponse.status).toBe(404)
    expect(wrongPrefixResponse.status).toBe(404)

    const access = payload.collections[versionedCloudMediaSlug].config.access
    const read = access.read
    const readVersions = access.readVersions

    try {
      access.read = () => false
      const parentDenied = await restClient.GET(
        `${historicalURL.pathname.replace(/^\/api/, '')}${historicalURL.search}`,
      )

      expect(parentDenied.status).toBe(403)
      access.read = read
      access.readVersions = () => false
      const versionDenied = await restClient.GET(
        `${historicalURL.pathname.replace(/^\/api/, '')}${historicalURL.search}`,
      )

      expect(versionDenied.status).toBe(403)
    } finally {
      access.read = read
      access.readVersions = readVersions
    }

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

    const currentRead = await payload.findByID({
      id: first.id,
      collection: versionedCloudMediaSlug,
      overrideAccess: false,
    })
    const currentURL = new URL(currentRead.url!, 'http://localhost')
    const currentResponse = await restClient.GET(
      `${currentURL.pathname.replace(/^\/api/, '')}${currentURL.search}`,
    )
    const historicalAfterRestore = await restClient.GET(
      `${historicalURL.pathname.replace(/^\/api/, '')}${historicalURL.search}`,
    )

    expect(currentURL.searchParams.has('version')).toBe(false)
    expect(currentResponse.status).toBe(200)
    expect(Buffer.from(await currentResponse.arrayBuffer())).toEqual(firstBytes)
    expect(historicalAfterRestore.status).toBe(200)
    expect(Buffer.from(await historicalAfterRestore.arrayBuffer())).toEqual(firstBytes)
  })

  test('should retain exact cloud references across documents and non-latest versions', async ({
    payload,
  }) => {
    const collection = payload.collections[versionedCloudMediaSlug].config
    const source = { _objectKey: 'source', filename: 'source.png', prefix: 'originals' }
    const history = { _objectKey: 'old', filename: 'history.png', prefix: 'history' }
    const doc = await payload.db.create({
      collection: versionedCloudMediaSlug,
      data: { _objectKey: 'active', filename: 'current.png', original: source, prefix: 'current' },
    })
    await payload.db.create({
      collection: versionedCloudMediaSlug,
      data: { _objectKey: 'active', filename: 'shared.png', original: source, prefix: 'shared' },
    })
    const oldVersion = await payload.db.createVersion({
      autosave: false,
      collectionSlug: versionedCloudMediaSlug,
      parent: doc.id,
      updatedAt: '2026-01-01T00:00:00.000Z',
      versionData: { filename: 'history-main.png', original: history },
    })
    await payload.db.createVersion({
      autosave: false,
      collectionSlug: versionedCloudMediaSlug,
      parent: doc.id,
      updatedAt: '2026-01-02T00:00:00.000Z',
      versionData: { filename: 'current.png', original: source },
    })
    const versions = await payload.db.findVersions({
      collection: versionedCloudMediaSlug,
      where: { id: { equals: oldVersion.id } },
    })
    await Promise.all(
      Array.from({ length: 101 }, (_, index) =>
        payload.db.create({
          collection: versionedCloudMediaSlug,
          data: {
            filename: `other-${index}.png`,
            original: { ...source, _objectKey: `other-${index}` },
          },
        }),
      ),
    )
    const retained = [
      'originals/source/source.png',
      'originals/other-100/source.png',
      'history/old/history.png',
    ]
    const unreferenced = [
      'different-prefix/source/source.png',
      'originals/different-object/source.png',
    ]
    const bytes = await readFile(firstFile)
    for (const key of [...retained, ...unreferenced]) {
      versionedCloudFiles.set(key, bytes)
    }
    const req = await createPayloadRequest({ payload })

    expect(versions.docs[0]!.latest).toBeFalsy()
    await scheduleUnreferencedFileCleanup({
      candidates: [...retained, ...unreferenced].map((key) => ({
        key,
        roles: [{ type: 'original' }],
      })),
      collection,
      req,
    })

    expect([...versionedCloudFiles.keys()].sort()).toEqual(retained.sort())
    expect(versionedCloudCalls.deletes.sort()).toEqual(unreferenced.sort())
    expect(versionedCloudCalls.uploads).toBe(0)
  })

  test('should log failed cleanup without masking a nontransactional delete hook error', async ({
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
    const hooks = payload.collections[versionedCloudMediaSlug].config.hooks
    const afterDelete = hooks.afterDelete

    hooks.afterDelete = [
      ...afterDelete,
      () => {
        throw new Error('Cloud delete hook failed')
      },
    ]

    try {
      await expect(
        payload.delete({
          id: first.id,
          collection: versionedCloudMediaSlug,
          disableTransaction: true,
        }),
      ).rejects.toThrow('Cloud delete hook failed')

      expect(
        await payload.db.findOne({
          collection: versionedCloudMediaSlug,
          where: { id: { equals: first.id } },
        }),
      ).toBeNull()
      const versions = await payload.db.findVersions({
        collection: versionedCloudMediaSlug,
        where: { parent: { equals: first.id } },
      })

      expect(versions.docs).toEqual([])
      expect(versionedCloudFiles.has(firstKey)).toBe(true)
      expect(versionedCloudFiles.has(currentKey)).toBe(false)
      expect(versionedCloudCalls.deletes).toContain(firstKey)
      expect(logged).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: expect.stringContaining(firstKey),
        }),
      )
    } finally {
      hooks.afterDelete = afterDelete
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
    for (const url of [historical.version.url, historical.version.original!.url]) {
      expect(new URL(url!).searchParams.has('version')).toBe(false)
    }

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

      const req = await createPayloadRequest({ payload })
      versionedCloudFailure.afterChange = true
      await expect(
        payload.update({
          id: first.id,
          collection: versionedCloudMediaSlug,
          data: {},
          filePath: secondFile,
          overrideAccess: true,
          req,
        }),
      ).rejects.toThrow('Cloud test afterChange failed')

      expect(Object.hasOwn(req.context, '_payloadManagedCloudStorage')).toBe(false)
      expect(Object.hasOwn(req.context, '_payloadManagedCloudMetadata')).toBe(false)
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
