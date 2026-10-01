/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.skipIf"] }] -- Tests use the shared fixture wrapper. */
/* eslint @typescript-eslint/require-await: off -- Storage callbacks are asynchronous in production; these fakes record synchronous effects. */
import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- The file operation manager is internal until upload writers use it.
import { runFileOperationPlan } from '../../packages/payload/src/uploads/fileVersioning/fileOperationManager.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports -- Transaction helpers are internal.
import { commitTransaction } from '../../packages/payload/src/utilities/commitTransaction.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports -- Transaction helpers are internal.
import { initTransaction } from '../../packages/payload/src/utilities/initTransaction.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports -- Transaction helpers are internal.
import { killTransaction } from '../../packages/payload/src/utilities/killTransaction.js'
import { test } from '../__helpers/int/vitest.js'
import { draftMediaSlug, mediaSlug } from './shared.js'

test.suite('File operation manager', { config: './config.ts' }, () => {
  test('should wait for a no-transaction outer update and its hooks', async ({ payload }) => {
    const doc = await payload.db.create({ collection: mediaSlug, data: { alt: 'before' } })
    const hooks = payload.collections[mediaSlug].config.hooks
    const originalBeforeChange = hooks.beforeChange
    const originalAfterChange = hooks.afterChange
    const events: string[] = []
    let shouldFail = true

    hooks.beforeChange = [
      ...(originalBeforeChange ?? []),
      async ({ data, req }) => {
        await runFileOperationPlan({
          id: doc.id,
          cleanup: async () => {
            events.push('cleanup')
          },
          collection: mediaSlug,
          req,
          stage: async () => {
            events.push('stage')
          },
          write: async () => {
            events.push('plan write')
          },
        })

        return data
      },
    ]
    hooks.afterChange = [
      ...(originalAfterChange ?? []),
      ({ doc: updated }) => {
        events.push('afterChange')
        if (shouldFail) {
          throw new Error('outer hook failed')
        }
        return updated
      },
    ]

    try {
      await expect(
        payload.update({
          id: doc.id,
          collection: mediaSlug,
          data: { alt: 'first attempt' },
          disableTransaction: true,
        }),
      ).rejects.toThrow('outer hook failed')

      expect(events).toEqual(['stage', 'plan write', 'afterChange'])
      const afterFailure = await payload.db.findOne({
        collection: mediaSlug,
        where: { id: { equals: doc.id } },
      })

      expect(afterFailure?._fileRevision).toBeTruthy()

      shouldFail = false
      events.length = 0

      await payload.update({
        id: doc.id,
        collection: mediaSlug,
        data: { alt: 'second attempt' },
        disableTransaction: true,
      })

      expect(events).toEqual(['stage', 'plan write', 'afterChange', 'cleanup'])
      const afterSuccess = await payload.db.findOne({
        collection: mediaSlug,
        where: { id: { equals: doc.id } },
      })

      expect(afterSuccess?._fileRevision).toBeTruthy()
      expect(afterSuccess?._fileRevision).not.toBe(afterFailure?._fileRevision)
    } finally {
      hooks.beforeChange = originalBeforeChange
      hooks.afterChange = originalAfterChange
    }
  })

  test('should reject one concurrent draft file change without touching the winner', async ({
    payload,
  }) => {
    const doc = await payload.db.create({
      collection: draftMediaSlug,
      data: { _status: 'published', alt: 'published', filename: 'published.jpg' },
    })
    await payload.db.createVersion({
      autosave: false,
      collectionSlug: draftMediaSlug,
      createdAt: new Date().toISOString(),
      parent: doc.id,
      updatedAt: new Date().toISOString(),
      versionData: { _status: 'published', alt: 'published', filename: 'published.jpg' },
    })
    const stored = new Set(['published.jpg'])
    const removed: string[] = []
    let staged = 0
    let releaseStages: () => void
    const stagesReady = new Promise<void>((resolve) => {
      releaseStages = resolve
    })

    const change = async (key: string) => {
      const req = await createPayloadRequest({ payload })

      return runFileOperationPlan({
        id: doc.id,
        collection: draftMediaSlug,
        req,
        stage: async ({ trackStagedObject }) => {
          stored.add(key)
          trackStagedObject({
            key,
            remove: async () => {
              stored.delete(key)
              removed.push(key)
            },
            storageBackendId: `local:${draftMediaSlug}`,
          })
          staged += 1
          if (staged === 2) {
            releaseStages()
          }
          await stagesReady
        },
        write: async () => {
          await payload.db.createVersion({
            autosave: false,
            collectionSlug: draftMediaSlug,
            createdAt: new Date().toISOString(),
            parent: doc.id,
            req,
            updatedAt: new Date().toISOString(),
            versionData: { _status: 'draft', alt: key, filename: key },
          })
        },
      })
    }

    const results = await Promise.allSettled([change('first.jpg'), change('second.jpg')])
    const rejected = results.filter((result) => result.status === 'rejected')
    const fulfilled = results.filter((result) => result.status === 'fulfilled')
    const published = await payload.db.findOne({
      collection: draftMediaSlug,
      where: { id: { equals: doc.id } },
    })
    const { docs: versions } = await payload.db.findVersions({
      collection: draftMediaSlug,
      where: { parent: { equals: doc.id } },
    })

    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)
    expect(rejected[0]?.reason).toMatchObject({ status: 409 })
    expect(published?.filename).toBe('published.jpg')
    expect(
      versions.some(({ version }) => version._status === 'draft' && stored.has(version.filename)),
    ).toBe(true)
    expect(stored.size).toBe(2)
    expect(removed).toHaveLength(1)
    expect(stored.has(removed[0]!)).toBe(false)
  })

  test.skipIf(process.env.PAYLOAD_DATABASE === 'sqlite')(
    'should return a conflict for a competing transaction after both stage files',
    async ({ payload }) => {
      const doc = await payload.db.create({
        collection: draftMediaSlug,
        data: { _status: 'published', filename: 'published.jpg' },
      })
      const stored = new Set(['published.jpg'])
      let staged = 0
      let releaseStages: () => void
      const stagesReady = new Promise<void>((resolve) => {
        releaseStages = resolve
      })

      const change = async (key: string) => {
        const req = await createPayloadRequest({ payload })

        expect(await initTransaction(req)).toBe(true)

        try {
          await runFileOperationPlan({
            id: doc.id,
            collection: draftMediaSlug,
            req,
            stage: async ({ trackStagedObject }) => {
              stored.add(key)
              trackStagedObject({
                key,
                remove: async () => {
                  stored.delete(key)
                },
                storageBackendId: `local:${draftMediaSlug}`,
              })
              staged += 1
              if (staged === 2) {
                releaseStages()
              }
              await stagesReady
            },
            write: async () => {},
          })
          await commitTransaction(req)
          return key
        } catch (err) {
          await killTransaction(req)
          throw err
        }
      }

      const results = await Promise.allSettled([change('first.jpg'), change('second.jpg')])
      const rejected = results.filter((result) => result.status === 'rejected')
      const fulfilled = results.filter((result) => result.status === 'fulfilled')

      expect(fulfilled).toHaveLength(1)
      expect(rejected).toHaveLength(1)
      expect(rejected[0]?.reason).toMatchObject({ status: 409 })
      expect(stored.size).toBe(2)
    },
  )
})
