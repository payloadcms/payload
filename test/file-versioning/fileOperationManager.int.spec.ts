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
  test.skipIf(process.env.PAYLOAD_DATABASE === 'sqlite')(
    'should stage before the write and defer cleanup until commit',
    async ({ payload }) => {
      const doc = await payload.db.create({ collection: mediaSlug, data: { alt: 'before' } })
      const req = await createPayloadRequest({ payload })
      const events: string[] = []

      expect(await initTransaction(req)).toBe(true)

      await runFileOperationPlan({
        collection: mediaSlug,
        id: doc.id,
        req,
        stage: async ({ trackStagedObject }) => {
          events.push('stage')
          trackStagedObject({
            key: 'attempt-only.jpg',
            remove: async () => {
              events.push('remove staged')
            },
            storageBackendId: `local:${mediaSlug}`,
          })
        },
        write: async () => {
          const stored = await payload.db.findOne({
            collection: mediaSlug,
            req,
            where: { id: { equals: doc.id } },
          })

          expect(stored?._fileRevision).toBeTruthy()
          events.push('write')
        },
        cleanup: async () => {
          events.push('cleanup')
        },
      })

      expect(events).toEqual(['stage', 'write'])

      await commitTransaction(req)

      expect(events).toEqual(['stage', 'write', 'cleanup'])
    },
  )

  test.skipIf(process.env.PAYLOAD_DATABASE === 'sqlite')(
    'should discard cleanup and compensate only staged objects after rollback',
    async ({ payload }) => {
      const doc = await payload.db.create({ collection: mediaSlug, data: { alt: 'before' } })
      const req = await createPayloadRequest({ payload })
      const events: string[] = []

      expect(await initTransaction(req)).toBe(true)

      await runFileOperationPlan({
        collection: mediaSlug,
        id: doc.id,
        req,
        stage: async ({ trackStagedObject }) => {
          trackStagedObject({
            key: 'attempt-only.jpg',
            remove: async () => {
              events.push('remove staged')
            },
            storageBackendId: `local:${mediaSlug}`,
          })
        },
        write: async () => {
          events.push('write')
        },
        cleanup: async () => {
          events.push('cleanup')
        },
      })

      await killTransaction(req)

      expect(events).toEqual(['write', 'remove staged'])
    },
  )

  test.skipIf(process.env.PAYLOAD_DATABASE === 'sqlite')(
    'should wait for the parent operation when a nested operation succeeds',
    async ({ payload }) => {
      const doc = await payload.db.create({ collection: mediaSlug, data: { alt: 'before' } })
      const req = await createPayloadRequest({ payload })
      const events: string[] = []

      expect(await initTransaction(req)).toBe(true)

      await runFileOperationPlan({
        collection: mediaSlug,
        id: doc.id,
        req,
        stage: async () => {
          events.push('outer stage')
        },
        write: async () => {
          await runFileOperationPlan({
            collection: mediaSlug,
            id: doc.id,
            req,
            stage: async () => {
              events.push('inner stage')
            },
            write: async () => {
              events.push('inner write')
            },
            cleanup: async () => {
              events.push('inner cleanup')
            },
          })
          events.push('outer write')
        },
        cleanup: async () => {
          events.push('outer cleanup')
        },
      })

      expect(events).toEqual(['outer stage', 'inner stage', 'inner write', 'outer write'])

      await commitTransaction(req)

      expect(events).toEqual([
        'outer stage',
        'inner stage',
        'inner write',
        'outer write',
        'inner cleanup',
        'outer cleanup',
      ])
    },
  )

  test.skipIf(process.env.PAYLOAD_DATABASE === 'sqlite')(
    'should retain old files when a hook fails before commit',
    async ({ payload }) => {
      const doc = await payload.db.create({ collection: mediaSlug, data: { alt: 'before' } })
      const req = await createPayloadRequest({ payload })
      const stored = new Set(['old.jpg'])
      const cleaned: string[] = []

      expect(await initTransaction(req)).toBe(true)

      await expect(
        runFileOperationPlan({
          collection: mediaSlug,
          id: doc.id,
          req,
          stage: async ({ trackStagedObject }) => {
            stored.add('staged.jpg')
            trackStagedObject({
              key: 'staged.jpg',
              remove: async () => {
                stored.delete('staged.jpg')
              },
              storageBackendId: `local:${mediaSlug}`,
            })
          },
          write: async () => {
            throw new Error('hook failed')
          },
          cleanup: async () => {
            cleaned.push('old.jpg')
            stored.delete('old.jpg')
          },
        }),
      ).rejects.toThrow('hook failed')

      expect(stored.has('old.jpg')).toBe(true)
      expect(cleaned).toEqual([])

      await killTransaction(req)

      expect(stored).toEqual(new Set(['old.jpg']))
      expect(cleaned).toEqual([])
    },
  )

  test.skipIf(process.env.PAYLOAD_DATABASE === 'sqlite')(
    'should compensate nested stages when the parent rolls back',
    async ({ payload }) => {
      const doc = await payload.db.create({ collection: mediaSlug, data: { alt: 'before' } })
      const req = await createPayloadRequest({ payload })
      const staged = new Set<string>()
      const cleaned: string[] = []

      expect(await initTransaction(req)).toBe(true)

      await runFileOperationPlan({
        collection: mediaSlug,
        id: doc.id,
        req,
        stage: async ({ trackStagedObject }) => {
          staged.add('outer.jpg')
          trackStagedObject({
            key: 'outer.jpg',
            remove: async () => {
              staged.delete('outer.jpg')
            },
            storageBackendId: `local:${mediaSlug}`,
          })
        },
        write: async () => {
          await runFileOperationPlan({
            collection: mediaSlug,
            id: doc.id,
            req,
            stage: async ({ trackStagedObject }) => {
              staged.add('inner.jpg')
              trackStagedObject({
                key: 'inner.jpg',
                remove: async () => {
                  staged.delete('inner.jpg')
                },
                storageBackendId: `local:${mediaSlug}`,
              })
            },
            write: async () => {},
            cleanup: async () => {
              cleaned.push('inner')
            },
          })
        },
        cleanup: async () => {
          cleaned.push('outer')
        },
      })

      expect(staged).toEqual(new Set(['inner.jpg', 'outer.jpg']))

      await killTransaction(req)

      expect(staged.size).toBe(0)
      expect(cleaned).toEqual([])
    },
  )

  test.skipIf(process.env.PAYLOAD_DATABASE !== 'mongodb')(
    'should finish cleanup only after a successful no-transaction MongoDB operation',
    async ({ payload }) => {
      const doc = await payload.db.create({ collection: mediaSlug, data: { alt: 'before' } })
      const successfulReq = await createPayloadRequest({ payload })
      const failedReq = await createPayloadRequest({ payload })
      const events: string[] = []

      await runFileOperationPlan({
        collection: mediaSlug,
        id: doc.id,
        req: successfulReq,
        stage: async () => {
          events.push('successful stage')
        },
        write: async () => {
          events.push('successful write')
        },
        cleanup: async () => {
          events.push('successful cleanup')
        },
      })

      expect(events).toEqual(['successful stage', 'successful write', 'successful cleanup'])

      await expect(
        runFileOperationPlan({
          collection: mediaSlug,
          id: doc.id,
          req: failedReq,
          stage: async () => {
            events.push('failed stage')
          },
          write: async () => {
            events.push('failed write')
            throw new Error('hook failed')
          },
          cleanup: async () => {
            events.push('failed cleanup')
          },
        }),
      ).rejects.toThrow('hook failed')

      expect(events).toEqual([
        'successful stage',
        'successful write',
        'successful cleanup',
        'failed stage',
        'failed write',
      ])
    },
  )

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
          collection: mediaSlug,
          id: doc.id,
          req,
          stage: async () => {
            events.push('stage')
          },
          write: async () => {
            events.push('plan write')
          },
          cleanup: async () => {
            events.push('cleanup')
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
          collection: mediaSlug,
          data: { alt: 'first attempt' },
          disableTransaction: true,
          id: doc.id,
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
        collection: mediaSlug,
        data: { alt: 'second attempt' },
        disableTransaction: true,
        id: doc.id,
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

  test('should reject a changed latest version after staging', async ({ payload }) => {
    const doc = await payload.db.create({ collection: mediaSlug, data: { alt: 'before' } })
    const req = await createPayloadRequest({ payload })
    const staged = new Set<string>()
    let hasWritten = false

    await expect(
      runFileOperationPlan({
        collection: mediaSlug,
        id: doc.id,
        req,
        stage: async ({ trackStagedObject }) => {
          staged.add('attempt.jpg')
          trackStagedObject({
            key: 'attempt.jpg',
            remove: async () => {
              staged.delete('attempt.jpg')
            },
            storageBackendId: `local:${mediaSlug}`,
          })
          await payload.db.createVersion({
            autosave: false,
            collectionSlug: mediaSlug,
            createdAt: new Date().toISOString(),
            parent: doc.id,
            updatedAt: new Date().toISOString(),
            versionData: { alt: 'newer version' },
          })
        },
        write: async () => {
          hasWritten = true
        },
      }),
    ).rejects.toMatchObject({ status: 409 })

    expect(hasWritten).toBe(false)
    expect(staged.size).toBe(0)
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
        collection: draftMediaSlug,
        id: doc.id,
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
            versionData: { alt: key, filename: key, _status: 'draft' },
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
            collection: draftMediaSlug,
            id: doc.id,
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
