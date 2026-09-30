/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Tests use the shared fixture wrapper. */
import type { Payload } from 'payload'

import path from 'node:path'
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  unversionedCloudMediaSlug,
  versionedCloudMediaSlug,
  versionedPublicCloudMediaSlug,
} from './shared.js'
import {
  versionedCloudCalls,
  versionedCloudFailure,
  versionedCloudFiles,
} from './versionedCloudStorage.js'

const firstFile = path.resolve(import.meta.dirname, '../uploads/image.png')
const secondFile = path.resolve(import.meta.dirname, '../uploads/small.png')

const getManagedFiles = async ({
  id,
  payload,
}: {
  id: number | string
  payload: Payload
}): Promise<Array<{ key: string; roles: Array<{ type: string }> }>> => {
  const doc = await payload.db.findOne({
    collection: versionedCloudMediaSlug,
    where: { id: { equals: id } },
  })
  return ((doc as { _managedFiles?: unknown } | null)?._managedFiles ?? []) as Array<{
    key: string
    roles: Array<{ type: string }>
  }>
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
    const before = await getManagedFiles({ id: created.id, payload })
    const oldKey = before[0]!.key
    const bytes = Buffer.from(versionedCloudFiles.get(oldKey)!)
    const renamed = await payload.renameFile({
      id: created.id,
      collection: versionedCloudMediaSlug,
      filename: 'renamed.png',
      overrideAccess: true,
    })
    const after = await getManagedFiles({ id: created.id, payload })

    expect(renamed.filename).toBe('renamed.png')
    expect(renamed.url).toContain('/renamed.png')
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

  test('should use native move for an unversioned rename', async ({ payload }) => {
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

    expect(renamed.filename).toBe('moved.png')
    expect(versionedCloudCalls.moves).toBe(1)
    expect(versionedCloudFiles.has(oldKey)).toBe(false)
    const current = await payload.db.findOne<{ _managedFiles: { key: string }[] }>({
      collection: unversionedCloudMediaSlug,
      where: { id: { equals: created.id } },
    })
    expect(versionedCloudFiles.has(current!._managedFiles[0]!.key)).toBe(true)
  })

  test('should restore the old key when an unversioned native rename fails after moving', async ({
    payload,
  }) => {
    const created = await payload.create({
      collection: unversionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const oldKey = [...versionedCloudFiles.keys()][0]!
    versionedCloudFailure.afterChange = true

    await expect(
      payload.renameFile({
        id: created.id,
        collection: unversionedCloudMediaSlug,
        filename: 'failed.png',
        overrideAccess: true,
      }),
    ).rejects.toThrow('Cloud test afterChange failed')

    expect(versionedCloudFiles.has(oldKey)).toBe(true)
    expect([...versionedCloudFiles.keys()].some((key) => key.endsWith('/failed.png'))).toBe(false)
  })

  test('should restore earlier objects when a later native move fails', async ({ payload }) => {
    const created = await payload.create({
      collection: unversionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const originalKey = [...versionedCloudFiles.keys()][0]!
    const thumbnailKey = originalKey.replace(/\.png$/, '-thumbnail.png')
    versionedCloudFiles.set(thumbnailKey, Buffer.from('thumbnail'))
    await payload.db.updateOne({
      collection: unversionedCloudMediaSlug,
      data: {
        _managedFiles: [
          {
            key: originalKey,
            roles: [{ type: 'default' }, { type: 'original' }],
            storageBackendId: `test-cloud:${unversionedCloudMediaSlug}`,
          },
          {
            key: thumbnailKey,
            roles: [{ type: 'thumbnail' }],
            storageBackendId: `test-cloud:${unversionedCloudMediaSlug}`,
          },
        ],
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
    expect(versionedCloudFiles.has(thumbnailKey)).toBe(true)
    expect([...versionedCloudFiles.keys()].some((key) => key.endsWith('/later.png'))).toBe(false)
    const saved = await payload.db.findOne({
      collection: unversionedCloudMediaSlug,
      where: { id: { equals: created.id } },
    })
    expect(saved?.filename).toBe(created.filename)
  })

  test('should restore a native move when the database commit fails', async ({ payload }) => {
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
    expect([...versionedCloudFiles.keys()].some((key) => key.endsWith('/uncommitted.png'))).toBe(
      false,
    )
    const saved = await payload.db.findOne({
      collection: unversionedCloudMediaSlug,
      where: { id: { equals: created.id } },
    })
    expect(saved?.filename).toBe(created.filename)
  })

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
      const after = await payload.db.findOne<{ _managedFiles: { key: string }[] }>({
        collection: unversionedCloudMediaSlug,
        where: { id: { equals: created.id } },
      })

      expect(renamed.filename).toBe('copied.png')
      expect(versionedCloudCalls.moves).toBe(0)
      expect(versionedCloudFiles.has(oldKey)).toBe(false)
      expect(versionedCloudFiles.get(after!._managedFiles[0]!.key)).toEqual(bytes)
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
      data: { url: 'https://external.example.test/image.png' },
      where: { id: { equals: created.id } },
    })

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
    const current = (await getManagedFiles({ id: created.id, payload }))[0]!.key
    const destination = current.replace(/[^/]+$/, 'occupied.png')
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
    expect((await getManagedFiles({ id: created.id, payload }))[0]?.key).toBe(current)
  })

  test('should reject a concurrent rename and remove its staged copy', async ({ payload }) => {
    const created = await payload.create({
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    let arrivals = 0
    let release!: () => void
    const bothStaged = new Promise<void>((resolve) => {
      release = resolve
    })
    versionedCloudFailure.beforeCopy = async () => {
      arrivals += 1
      if (arrivals === 2) {
        release()
      }
      await bothStaged
    }

    const results = await Promise.allSettled([
      payload.renameFile({
        id: created.id,
        collection: versionedCloudMediaSlug,
        filename: 'first.png',
        overrideAccess: true,
      }),
      payload.renameFile({
        id: created.id,
        collection: versionedCloudMediaSlug,
        filename: 'second.png',
        overrideAccess: true,
      }),
    ])
    const successes = results.filter((result) => result.status === 'fulfilled')
    const failures = results.filter((result) => result.status === 'rejected')
    const current = await getManagedFiles({ id: created.id, payload })

    expect(successes).toHaveLength(1)
    expect(failures).toHaveLength(1)
    expect(versionedCloudFiles.has(current[0]!.key)).toBe(true)
    expect(
      [...versionedCloudFiles.keys()].filter(
        (key) => key.endsWith('/first.png') || key.endsWith('/second.png'),
      ),
    ).toHaveLength(1)
  })

  test('should keep direct provider URLs working after rename', async ({ payload }) => {
    const created = await payload.create({
      collection: versionedPublicCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const renamed = await payload.renameFile({
      id: created.id,
      collection: versionedPublicCloudMediaSlug,
      filename: 'renamed.png',
      overrideAccess: true,
    })

    expect(renamed.url).toContain('/renamed.png')
    expect(renamed.url).toMatch(/^https:\/\/files\.example\.test\//)
    const { docs } = await payload.db.findVersions({
      collection: versionedPublicCloudMediaSlug,
      where: { parent: { equals: created.id } },
    })
    const previous = docs.find(({ version }) => version.filename === created.filename)
    expect(previous).toBeDefined()
    const historical = await payload.findVersionByID({
      id: previous!.id,
      collection: versionedPublicCloudMediaSlug,
      overrideAccess: false,
    })
    expect(historical.version.url).toMatch(/^https:\/\/files\.example\.test\//)
    expect(historical.version.filename).toBe(created.filename)
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
    const firstManifest = await getManagedFiles({ id: first.id, payload })
    const firstKey = firstManifest[0]!.key
    const firstBytes = Buffer.from(versionedCloudFiles.get(firstKey)!)

    expect(firstManifest[0]?.roles).toEqual(
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

    const secondManifest = await getManagedFiles({ id: second.id, payload })

    expect(secondManifest[0]?.key).not.toBe(firstKey)
    expect(versionedCloudFiles.get(firstKey)).toEqual(firstBytes)
    expect(versionedCloudFiles.get(secondManifest[0]!.key)).toBeTruthy()
    expect(versionedCloudCalls.deletes).toEqual([])
    expect(versionedCloudCalls.uploads).toBe(2)
    expect(versionedCloudCalls.afterChanges).toBe(4)
    expect(second.storageMarker).toBe(secondManifest[0]!.key)
    const saved = await payload.db.findOne({
      collection: versionedCloudMediaSlug,
      where: { id: { equals: first.id } },
    })
    expect(saved?.storageMarker).toBe(secondManifest[0]!.key)

    const { docs } = await payload.db.findVersions({
      collection: versionedCloudMediaSlug,
      limit: 10,
      where: { parent: { equals: first.id } },
    })
    expect(
      docs.some(({ version }) =>
        ((version as { _managedFiles?: Array<{ key: string }> })._managedFiles ?? []).some(
          ({ key }) => key === firstKey,
        ),
      ),
    ).toBe(true)
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
    const firstManifest = await getManagedFiles({ id: first.id, payload })
    const firstBytes = Buffer.from(versionedCloudFiles.get(firstManifest[0]!.key)!)

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
      (version._managedFiles ?? []).some(({ key }) => key === firstManifest[0]!.key),
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

    const currentManifest = await getManagedFiles({ id: first.id, payload })
    const { docs: after } = await payload.db.findVersions({
      collection: versionedCloudMediaSlug,
      pagination: false,
      where: { parent: { equals: first.id } },
    })

    expect(currentManifest[0]!.key).not.toBe(firstManifest[0]!.key)
    expect(versionedCloudFiles.get(currentManifest[0]!.key)).toEqual(firstBytes)
    expect(after.find(({ id }) => id === selected.id)?.version).toEqual(selected.version)
  })

  test('should retain a failed cloud deletion and log its exact storage identity', async ({
    payload,
  }) => {
    const first = await payload.create({
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
    })
    const firstKey = (await getManagedFiles({ id: first.id, payload }))[0]!.key

    await payload.update({
      id: first.id,
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: secondFile,
    })
    const currentKey = (await getManagedFiles({ id: first.id, payload }))[0]!.key
    const logged = vi.spyOn(payload.logger, 'error')
    versionedCloudFailure.deleteKey = firstKey

    try {
      await payload.delete({ id: first.id, collection: versionedCloudMediaSlug })

      expect(versionedCloudFiles.has(firstKey)).toBe(true)
      expect(versionedCloudFiles.has(currentKey)).toBe(false)
      expect(versionedCloudCalls.deletes).toContain(firstKey)
      expect(logged).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: expect.stringContaining(`test-cloud:${versionedCloudMediaSlug}:${firstKey}`),
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
    const firstKey = firstStored?._managedFiles?.[0]?.key

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
      version._managedFiles?.some(({ key }) => key === firstKey),
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

  test('should remove a staged cloud object when upload or a later hook fails', async ({
    payload,
  }) => {
    const first = await payload.create({
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const firstKey = (await getManagedFiles({ id: first.id, payload }))[0]!.key
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
    expect([...versionedCloudFiles.keys()]).toEqual(originalKeys)

    versionedCloudFailure.uploadNumber = 0
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
    expect((await getManagedFiles({ id: current.id, payload }))[0]?.key).toBe(firstKey)
    expect([...versionedCloudFiles.keys()]).toEqual(originalKeys)
    expect(versionedCloudCalls.deletes).not.toContain(firstKey)
  })

  test('should keep published bytes when saving a draft replacement', async ({ payload }) => {
    const published = await payload.create({
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const publishedKey = (await getManagedFiles({ id: published.id, payload }))[0]!.key

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
    expect(draftWithHidden._managedFiles?.[0]?.key).not.toBe(publishedKey)
    expect(versionedCloudFiles.has(publishedKey)).toBe(true)
    expect(versionedCloudCalls.deletes).toEqual([])

    const current = await payload.findByID({
      id: published.id,
      collection: versionedCloudMediaSlug,
      overrideAccess: true,
    })
    expect((await getManagedFiles({ id: current.id, payload }))[0]?.key).toBe(publishedKey)
  })

  test('should remove staged cloud bytes when the document write fails', async ({ payload }) => {
    const first = await payload.create({
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const firstKey = (await getManagedFiles({ id: first.id, payload }))[0]!.key
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

    expect((await getManagedFiles({ id: first.id, payload }))[0]?.key).toBe(firstKey)
    expect([...versionedCloudFiles.keys()]).toEqual(originalKeys)
    expect(versionedCloudCalls.deletes).not.toContain(firstKey)
  })

  test('should give repeated writes with the same filename distinct objects', async ({
    payload,
  }) => {
    const first = await payload.create({
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    const firstKey = (await getManagedFiles({ id: first.id, payload }))[0]!.key

    await payload.update({
      id: first.id,
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
      overwriteExistingFiles: true,
    })
    const secondKey = (await getManagedFiles({ id: first.id, payload }))[0]!.key

    await payload.update({
      id: first.id,
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
      overwriteExistingFiles: true,
    })
    const thirdKey = (await getManagedFiles({ id: first.id, payload }))[0]!.key

    expect(new Set([firstKey, secondKey, thirdKey]).size).toBe(3)
    expect([firstKey, secondKey, thirdKey].every((key) => versionedCloudFiles.has(key))).toBe(true)
    expect(versionedCloudCalls.uploads).toBe(3)
    expect(versionedCloudCalls.deletes).toEqual([])
  })

  test('should leave the winning cloud object intact after simultaneous replacements', async ({
    payload,
  }) => {
    const first = await payload.create({
      collection: versionedCloudMediaSlug,
      data: {},
      filePath: firstFile,
      overrideAccess: true,
    })
    let waiting = 0
    let release!: () => void
    const barrier = new Promise<void>((resolve) => {
      release = resolve
    })
    versionedCloudFailure.beforeUpload = async () => {
      waiting += 1
      if (waiting === 2) {
        release()
      }
      await barrier
    }

    const results = await Promise.allSettled(
      [secondFile, firstFile].map((filePath) =>
        payload.update({
          id: first.id,
          collection: versionedCloudMediaSlug,
          data: {},
          filePath,
          overrideAccess: true,
        }),
      ),
    )

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(1)
    const winningKey = (await getManagedFiles({ id: first.id, payload }))[0]!.key
    expect(versionedCloudFiles.has(winningKey)).toBe(true)
    expect(versionedCloudCalls.deletes).not.toContain(winningKey)
    expect(versionedCloudFiles.size).toBe(2)
  })
})
