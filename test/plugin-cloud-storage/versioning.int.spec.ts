/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Tests use the shared fixture wrapper. */
import type { Payload } from 'payload'

import path from 'node:path'
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { versionedCloudMediaSlug, versionedPublicCloudMediaSlug } from './shared.js'
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
    versionedCloudCalls.uploads = 0
    versionedCloudFailure.afterChange = false
    versionedCloudFailure.beforeUpload = undefined
    versionedCloudFailure.uploadNumber = 0
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
