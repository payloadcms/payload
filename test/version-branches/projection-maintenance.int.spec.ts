/* eslint-disable payload/no-relative-monorepo-imports -- Verify atomic derived relation maintenance. */
import type { Payload, PayloadRequest } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import {
  decodeBranchProjectionDocument,
  encodeBranchProjectionID,
} from '../../packages/payload/src/versions/branches/queries/branchProjectionCodec.js'
import { captureBranchProjectionGuard } from '../../packages/payload/src/versions/branches/queries/branchProjectionGuard.js'
import { bootstrapBranchProjectionPage } from '../../packages/payload/src/versions/branches/queries/branchProjectionStore.js'
import { queryBranchContent } from '../../packages/payload/src/versions/branches/queries/queryBranchContent.js'
import {
  queryBranchGlobal,
  queryBranchGlobalGraph,
} from '../../packages/payload/src/versions/branches/queries/queryBranchGlobal.js'
import {
  discardBranchHead,
  readBranchHeadToken,
  writeBranchHead,
} from '../../packages/payload/src/versions/branches/storage/branchHeadStore.js'
import {
  createBranchIdentityVisibility,
  updateBranchIdentityVisibility,
} from '../../packages/payload/src/versions/branches/storage/branchIdentityStore.js'
import { initializeBranchVersion } from '../../packages/payload/src/versions/branches/storage/branchVersionStore.js'
import { test } from '../__helpers/int/vitest.js'
import { nativeBranchDatabaseOptions } from './adapterCapabilities.js'
import {
  articleHeadsSlug,
  articlesSlug,
  queryDocsSlug,
  queryTagsSlug,
  scalarArticlesSlug,
  settingsHeadsSlug,
  settingsSlug,
} from './slugs.js'

const shared = { type: 'shared' as const }
const en = { type: 'locale' as const, locale: 'en' }
const fr = { type: 'locale' as const, locale: 'fr' }

test.suite(
  'Atomic branch projection maintenance',
  { config: './config.ts', ...nativeBranchDatabaseOptions },
  () => {
    test('should maintain inherited content and visibility in the caller transaction', async ({
      payload,
    }) => {
      const doc = await payload.create({ collection: articlesSlug, data: { title: 'Anchor' } })
      const target = { collection: articleHeadsSlug, parentID: doc.id }

      await transaction({
        payload,
        run: async ({ req }) => {
          const ref = await revision({
            data: { shared: 'Live', title: { en: 'English', fr: 'French' } },
            req,
            target,
          })

          for (const scope of [shared, en, fr]) {
            await setHead({ branchID: 'main', req, scope, target, ref })
          }
          await bootstrapBranchProjectionPage({
            branchID: 'staging',
            collection: target.collection,
            req,
          })
          expect(await projection({ branchID: 'staging', payload, req, target })).toMatchObject({
            shared: 'Live',
            title: { en: 'English', fr: 'French' },
          })
          await createBranchIdentityVisibility({
            branchID: 'drafts',
            isLegacyDraftVisible: false,
            req,
            target,
          })
          expect(
            (await rawProjection({ branchID: 'staging', payload, req, target }))?._branchProjection
              .isVisible,
          ).toBe(false)
          await updateBranchIdentityVisibility({
            expectedGeneration: 1,
            isPublished: true,
            req,
            target,
          })
          expect(
            (await rawProjection({ branchID: 'staging', payload, req, target }))?._branchProjection
              .isVisible,
          ).toBe(true)
        },
      })
    })

    test('should replace omitted nested fields and locales without retaining stale data', async ({
      payload,
    }) => {
      const doc = await payload.create({ collection: articlesSlug, data: { title: 'Anchor' } })
      const target = { collection: articleHeadsSlug, parentID: doc.id }

      await transaction({
        payload,
        run: async ({ req }) => {
          const old = await revision({
            data: {
              shared: 'Old',
              title: { en: 'English', fr: 'French' },
              sections: [
                { id: 'row', label: 'Before', translation: { en: 'Before', fr: 'Avant' } },
              ],
            },
            req,
            target,
          })

          for (const scope of [shared, en, fr]) {
            await setHead({ branchID: 'main', req, scope, target, ref: old })
          }
          await bootstrapBranchProjectionPage({
            branchID: 'staging',
            collection: target.collection,
            req,
          })
          const next = await revision({
            data: { title: { en: 'New' }, sections: [{ id: 'row', translation: { en: 'New' } }] },
            req,
            target,
          })

          for (const scope of [shared, en, fr]) {
            await setHead({ branchID: 'main', req, scope, target, ref: next })
          }
          const actual = await projection({ branchID: 'staging', payload, req, target })

          expect(actual.shared == null).toBe(true)
          expect(actual.title).not.toHaveProperty('fr')
          expect(actual.sections[0]).toMatchObject({
            id: 'row',
            translation: { en: 'New' },
          })
          expect(actual.sections[0].label == null).toBe(true)
          expect(actual.sections[0].translation).not.toHaveProperty('fr')
          if (payload.db.name === 'mongoose') {
            const removed = await queryBranchContent({
              branchID: 'staging',
              collection: articlesSlug,
              locale: 'en',
              req,
              joins: false,
              where: { 'title.fr': { exists: false } },
            })
            // eslint-disable-next-line @vitest/no-conditional-expect -- Mongo predicates distinguish absent locale keys before decoding; SQL physical columns cannot.
            expect(removed.docs.map(({ id }) => id)).toEqual([doc.id])
          }
        },
      })
    })

    test('should keep main commits and unaffected locales available across structural conflicts', async ({
      payload,
    }) => {
      const doc = await payload.create({ collection: articlesSlug, data: { title: 'Anchor' } })
      const target = { collection: articleHeadsSlug, parentID: doc.id }

      await transaction({
        payload,
        run: async ({ req }) => {
          const old = await revision({
            data: {
              title: { en: 'English', fr: 'French' },
              sections: [{ id: 'old', translation: { en: 'Old', fr: 'Ancien' } }],
            },
            req,
            target,
          })
          const next = await revision({
            data: {
              title: { en: 'New', fr: 'Nouveau' },
              sections: [{ id: 'new', translation: { en: 'New', fr: 'Nouveau' } }],
            },
            req,
            target,
          })

          for (const scope of [shared, en, fr]) {
            await setHead({ branchID: 'main', req, scope, target, ref: old })
          }
          await setHead({ branchID: 'staging', req, scope: fr, target, ref: old })
          await bootstrapBranchProjectionPage({
            branchID: 'staging',
            collection: target.collection,
            req,
          })
          for (const scope of [shared, en, fr]) {
            await setHead({ branchID: 'main', req, scope, target, ref: next })
          }
          const control = payload.collections[articlesSlug]!.config.custom.branchQueryStorage

          await expect(
            captureBranchProjectionGuard({
              branchID: 'staging',
              control,
              req,
              scopes: [shared, en],
            }),
          ).resolves.toBeDefined()
          await expect(
            captureBranchProjectionGuard({
              branchID: 'staging',
              control,
              req,
              scopes: [shared, fr],
            }),
          ).rejects.toMatchObject({ code: 'branch-structural-conflict' })
          const expected = await readBranchHeadToken({
            branchID: 'staging',
            req,
            scope: fr,
            target,
          })

          await discardBranchHead({ expected, req, target })
          await expect(
            captureBranchProjectionGuard({
              branchID: 'staging',
              control,
              req,
              scopes: [shared, fr],
            }),
          ).resolves.toBeDefined()
          expect(
            (await projection({ branchID: 'staging', payload, req, target })).sections[0]
              .translation.fr,
          ).toBe('Nouveau')
        },
      })
    })

    test('should preserve localized published status independently of missing locale content', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: articlesSlug,
        locale: 'en',
        data: { title: 'Published English', _status: 'published' },
      })
      expect(doc._status).toBe('published')
      expect(
        (await payload.findByID({ collection: articlesSlug, id: doc.id, locale: 'all' }))._status,
      ).toEqual(
        payload.db.name === 'mongoose' ? { en: 'published', fr: 'draft' } : { en: 'published' },
      )
      const target = { collection: articleHeadsSlug, parentID: doc.id }
      await transaction({
        payload,
        run: async ({ req }) => {
          const visibility = await createBranchIdentityVisibility({
            branchID: 'main',
            isLegacyDraftVisible: false,
            req,
            target,
          })
          await updateBranchIdentityVisibility({
            expectedGeneration: visibility.generation,
            isPublished: true,
            req,
            target,
          })
          const ref = await revision({
            data: { title: { en: 'Published English' }, _status: { en: 'draft' } },
            req,
            target,
          })
          for (const scope of [shared, en]) {
            await setHead({ branchID: 'main', req, scope, target, ref })
          }
          await bootstrapBranchProjectionPage({
            branchID: 'staging',
            collection: articleHeadsSlug,
            req,
          })
          const effective = await queryBranchContent({
            branchID: 'staging',
            collection: articlesSlug,
            locale: 'en',
            req,
            where: { _status: { equals: 'published' } },
          })
          expect(effective.docs).toMatchObject([
            { id: doc.id, _status: { en: 'published', fr: 'draft' } },
          ])
          const working = await revision({ data: { title: { fr: 'Working French' } }, req, target })
          await setHead({ branchID: 'staging', req, scope: fr, target, ref: working })
          expect(
            (
              await queryBranchContent({
                branchID: 'staging',
                collection: articlesSlug,
                locale: 'fr',
                req,
                where: { _status: { equals: 'draft' } },
              })
            ).docs,
          ).toMatchObject([{ id: doc.id, _status: { en: 'published', fr: 'draft' } }])
          await discardBranchHead({
            expected: await readBranchHeadToken({ branchID: 'staging', req, scope: fr, target }),
            req,
            target,
          })
          await discardBranchHead({
            expected: await readBranchHeadToken({ branchID: 'main', req, scope: en, target }),
            req,
            target,
          })
          await updateBranchIdentityVisibility({
            expectedGeneration: visibility.generation + 1,
            isPublished: false,
            req,
            target,
          })
          await bootstrapBranchProjectionPage({
            branchID: 'main',
            collection: articleHeadsSlug,
            req,
          })
          expect(
            (
              await queryBranchContent({
                branchID: 'main',
                collection: articlesSlug,
                locale: 'en',
                req,
                where: { _status: { equals: 'draft' } },
              })
            ).docs,
          ).toMatchObject([{ id: doc.id, _status: { en: 'draft', fr: 'draft' } }])
        },
      })
    })

    test('should publish scalar shared content without requiring configured locale heads', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: scalarArticlesSlug,
        data: { title: 'Published shared', _status: 'published' },
      })
      expect(
        (await payload.findByID({ collection: scalarArticlesSlug, id: doc.id, locale: 'all' }))
          ._status,
      ).toBe('published')
      const source = payload.collections[scalarArticlesSlug]!.config
      const target = { collection: source.custom.branchStorage.heads, parentID: doc.id }
      await transaction({
        payload,
        run: async ({ req }) => {
          const visibility = await createBranchIdentityVisibility({
            branchID: 'main',
            isLegacyDraftVisible: false,
            req,
            target,
          })
          await updateBranchIdentityVisibility({
            expectedGeneration: visibility.generation,
            isPublished: true,
            req,
            target,
          })
          const ref = await revision({
            data: { title: 'Published shared', _status: 'draft' },
            req,
            target,
          })
          await setHead({ branchID: 'main', req, scope: shared, target, ref })
          await bootstrapBranchProjectionPage({
            branchID: 'staging',
            collection: target.collection,
            req,
          })
          expect(
            (
              await queryBranchContent({
                branchID: 'staging',
                collection: scalarArticlesSlug,
                locale: 'all',
                req,
                where: { _status: { equals: 'published' } },
              })
            ).docs,
          ).toMatchObject([{ id: doc.id, _status: 'published' }])
          const working = await revision({
            data: { title: 'Working shared', _status: 'published' },
            req,
            target,
          })
          await setHead({ branchID: 'staging', req, scope: shared, target, ref: working })
          expect(
            (
              await queryBranchContent({
                branchID: 'staging',
                collection: scalarArticlesSlug,
                locale: 'all',
                req,
                where: { _status: { equals: 'draft' } },
              })
            ).docs,
          ).toMatchObject([{ id: doc.id, _status: 'draft', title: 'Working shared' }])
          await discardBranchHead({
            expected: await readBranchHeadToken({
              branchID: 'staging',
              req,
              scope: shared,
              target,
            }),
            req,
            target,
          })
          await discardBranchHead({
            expected: await readBranchHeadToken({ branchID: 'main', req, scope: shared, target }),
            req,
            target,
          })
          expect(
            (
              await queryBranchContent({
                branchID: 'staging',
                collection: scalarArticlesSlug,
                locale: 'all',
                req,
              })
            ).docs,
          ).toEqual([])
          const cached = await req.payload.db.findOne({
            collection: source.custom.branchQueryStorage.projection,
            joins: false,
            req,
            where: {
              id: { equals: encodeBranchProjectionID({ branchID: 'staging', logicalID: doc.id }) },
            },
          })
          expect(cached?._status).toBe('draft')
        },
      })
    })

    test('should roll back cache rows and dependency markers with authoritative heads', async ({
      payload,
    }) => {
      const doc = await payload.create({ collection: articlesSlug, data: { title: 'Anchor' } })
      const target = { collection: articleHeadsSlug, parentID: doc.id }

      await transaction({
        payload,
        shouldCommit: false,
        run: async ({ req }) => {
          const ref = await revision({
            data: { shared: 'Rolled back', title: { en: 'Temporary' } },
            req,
            target,
          })

          await setHead({ branchID: 'main', req, scope: shared, target, ref })
          expect(await rawProjection({ branchID: 'main', payload, req, target })).toBeTruthy()
        },
      })
      expect(await rawProjection({ branchID: 'main', payload, target })).toBeNull()
      expect(
        (
          await payload.db.find({
            collection: payload.collections[articlesSlug]!.config.custom.branchQueryStorage.states,
            pagination: false,
          })
        ).docs,
      ).toHaveLength(0)
    })

    test.options(
      'should reject a stale snapshot bootstrap or rebuild the newly committed main state',
      { db: (adapter) => adapter === 'postgres' || adapter === 'mongodb' },
      async ({ payload }) => {
        const doc = await payload.create({ collection: articlesSlug, data: { title: 'Anchor' } })
        const target = { collection: articleHeadsSlug, parentID: doc.id }
        let next: { generation: number; id: number | string }

        await transaction({
          payload,
          run: async ({ req }) => {
            const old = await revision({
              data: { shared: 'Old', title: { en: 'Old' } },
              req,
              target,
            })

            next = await revision({ data: { shared: 'New', title: { en: 'New' } }, req, target })
            await setHead({ branchID: 'main', req, scope: shared, target, ref: old })
            await setHead({ branchID: 'main', req, scope: en, target, ref: old })
          },
        })
        const req = await createPayloadRequest({ payload })
        const id = await payload.db.beginTransaction()

        if (id === null) {
          throw new Error('Native transaction required.')
        }
        req.transactionID = id
        // Establish the old native snapshot before main publishes; the new branch is not inventoried yet.
        await readBranchHeadToken({ branchID: 'main', req, scope: shared, target })
        await transaction({
          payload,
          run: async ({ req }) => {
            await setHead({ branchID: 'main', req, scope: shared, target, ref: next! })
            await setHead({ branchID: 'main', req, scope: en, target, ref: next! })
          },
        })
        let hasCommitted = false

        try {
          await bootstrapBranchProjectionPage({
            branchID: 'staging',
            collection: articleHeadsSlug,
            req,
          })
          await payload.db.commitTransaction(id)
          hasCommitted = true
        } catch (error) {
          if (payload.db.sessions?.[id]) {
            await payload.db.rollbackTransaction(id)
          }
          expect(error).toBeInstanceOf(Error)
        } finally {
          if (payload.db.sessions?.[id]) {
            await payload.db.rollbackTransaction(id)
          }
        }
        if (payload.db.name === 'mongoose') {
          expect(hasCommitted).toBe(false)
        }
        if (hasCommitted) {
          expect(await rawProjection({ branchID: 'staging', payload, target })).toMatchObject({
            shared: 'New',
            title: { en: 'New' },
          })
        } else {
          expect(await rawProjection({ branchID: 'staging', payload, target })).toBeNull()
          await transaction({
            payload,
            run: async ({ req }) => {
              await bootstrapBranchProjectionPage({
                branchID: 'staging',
                collection: articleHeadsSlug,
                req,
              })
              expect(await projection({ branchID: 'staging', payload, req, target })).toMatchObject(
                { shared: 'New', title: { en: 'New' } },
              )
            },
          })
        }
      },
    )

    test('should freeze a global forward graph before its ordinary singleton has materialized', async ({
      payload,
    }) => {
      expect(
        (await payload.db.findGlobal({ slug: settingsSlug, locale: 'all' }))?.id,
      ).toBeUndefined()
      await payload.create({
        collection: queryTagsSlug,
        data: { id: 20, title: 'Unmaterialized global target' },
      })
      await transaction({
        payload,
        run: async ({ req }) => {
          const target = { collection: settingsHeadsSlug }
          const ref = await revision({
            data: { shared: 'Unmaterialized', title: { en: 'Settings' }, tag: 20 },
            req,
            target,
          })
          for (const scope of [shared, en]) {
            await setHead({ branchID: 'main', req, scope, target, ref })
          }
          for (const collection of [
            articleHeadsSlug,
            `collection-${queryDocsSlug}-heads`,
            settingsHeadsSlug,
          ]) {
            await bootstrapBranchProjectionPage({ branchID: 'staging', collection, req })
          }
          const result = await queryBranchGlobalGraph({
            branchID: 'staging',
            global: settingsSlug,
            locale: 'en',
            depth: 1,
            req,
          })
          expect(result.result).toMatchObject({ shared: 'Unmaterialized' })
          expect(result.result).not.toHaveProperty('id')
          expect(
            await queryBranchGlobal({
              branchID: 'staging',
              global: settingsSlug,
              locale: 'en',
              req,
              where: { id: { exists: false } },
            }),
          ).toMatchObject({ shared: 'Unmaterialized' })
          expect(result.graph.get({ collection: queryTagsSlug, id: 20 })).toMatchObject({ id: 20 })
        },
      })
    })

    test('should bootstrap bounded pages and use a private singleton for globals', async ({
      payload,
    }) => {
      const first = await payload.create({ collection: articlesSlug, data: { title: 'First' } })
      await payload.updateGlobal({ slug: settingsSlug, data: { title: 'Native existing global' } })
      const nativeGlobal = await payload.findGlobal({ slug: settingsSlug, depth: 0 })
      await payload.create({
        collection: queryTagsSlug,
        data: { id: 20, title: 'Global ordinary tag' },
      })

      await payload.create({ collection: articlesSlug, data: { title: 'Second' } })
      await transaction({
        payload,
        run: async ({ req }) => {
          const target = { collection: articleHeadsSlug, parentID: first.id }
          const firstRef = await revision({
            data: { shared: 'Article', title: { en: 'Effective related' } },
            req,
            target,
          })
          await setHead({ branchID: 'main', req, scope: shared, target, ref: firstRef })
          await setHead({ branchID: 'main', req, scope: en, target, ref: firstRef })

          expect(
            await bootstrapBranchProjectionPage({
              branchID: 'staging',
              collection: target.collection,
              limit: 1,
              req,
            }),
          ).toEqual({ isComplete: false, processed: 1 })
          expect(
            await bootstrapBranchProjectionPage({
              branchID: 'staging',
              collection: target.collection,
              limit: 1,
              req,
            }),
          ).toEqual({ isComplete: false, processed: 1 })
          expect(
            await bootstrapBranchProjectionPage({
              branchID: 'staging',
              collection: target.collection,
              limit: 1,
              req,
            }),
          ).toEqual({ isComplete: true, processed: 0 })
          const globalTarget = { collection: settingsHeadsSlug }
          const ref = await revision({
            data: {
              shared: 'Global',
              title: { en: 'Settings' },
              related: { en: first.id, fr: first.id },
              tag: 20,
            },
            req,
            target: globalTarget,
          })

          await setHead({ branchID: 'main', req, scope: shared, target: globalTarget, ref })
          await setHead({ branchID: 'main', req, scope: en, target: globalTarget, ref })
          expect(
            await bootstrapBranchProjectionPage({
              branchID: 'staging',
              collection: globalTarget.collection,
              req,
            }),
          ).toEqual({ isComplete: true, processed: 1 })
          await bootstrapBranchProjectionPage({
            branchID: 'staging',
            collection: `collection-${queryDocsSlug}-heads`,
            req,
          })
          const effective = await queryBranchGlobal({
            branchID: 'staging',
            global: settingsSlug,
            locale: 'en',
            req,
          })
          expect(effective).toMatchObject({ shared: 'Global', title: { en: 'Settings' } })
          expect(effective?.id).toBe(nativeGlobal.id)
          expect(
            await queryBranchGlobal({
              branchID: 'staging',
              global: settingsSlug,
              locale: 'en',
              req,
              where: { id: { equals: nativeGlobal.id } },
            }),
          ).toMatchObject({ id: nativeGlobal.id })
          expect(
            await queryBranchGlobal({
              branchID: 'staging',
              global: settingsSlug,
              locale: 'en',
              req,
              where: { id: { not_equals: nativeGlobal.id } },
            }),
          ).toBeNull()
          req.context.settingsReadAccess = { id: { equals: nativeGlobal.id } }
          expect(
            await queryBranchGlobal({
              branchID: 'staging',
              global: settingsSlug,
              locale: 'en',
              req,
            }),
          ).toMatchObject({ id: nativeGlobal.id })
          req.context.settingsReadAccess = { id: { not_equals: nativeGlobal.id } }
          expect(
            await queryBranchGlobal({
              branchID: 'staging',
              global: settingsSlug,
              locale: 'en',
              req,
            }),
          ).toBeNull()
          req.context.settingsReadAccess = true
          const globalGraph = await queryBranchGlobalGraph({
            branchID: 'staging',
            depth: 2,
            global: settingsSlug,
            locale: 'en',
            req,
          })
          expect(globalGraph.graph.get({ collection: articlesSlug, id: first.id })).toMatchObject({
            id: first.id,
            title: { en: 'Effective related' },
          })
          expect(globalGraph.graph.get({ collection: queryTagsSlug, id: 20 })).toMatchObject({
            id: 20,
            title: 'Global ordinary tag',
          })
          expect(effective).not.toHaveProperty('_branchProjection')
          expect(
            await queryBranchGlobal({
              branchID: 'staging',
              global: settingsSlug,
              locale: 'en',
              req,
              where: { shared: { equals: 'Different' } },
            }),
          ).toBeNull()
          const storage = payload.globals.config.find(({ slug }) => slug === settingsSlug)!.custom
            .branchQueryStorage
          const row = await payload.db.findOne({
            collection: storage.projection,
            locale: 'all',
            req,
            where: {
              id: {
                equals: encodeBranchProjectionID({ branchID: 'staging', logicalID: 'singleton' }),
              },
            },
          })

          expect(row).toMatchObject({
            shared: 'Global',
            title: { en: 'Settings' },
            _branchProjection: { logicalID: 'singleton' },
          })
        },
      })
    })
  },
)

const transaction = async ({
  payload,
  run,
  shouldCommit = true,
}: {
  payload: Payload
  run: (args: { req: PayloadRequest }) => Promise<void>
  shouldCommit?: boolean
}) => {
  const req = await createPayloadRequest({ payload })
  const id = await payload.db.beginTransaction()

  if (id === null) {
    throw new Error('Native transaction required.')
  }
  req.transactionID = id
  try {
    await run({ req })
    if (shouldCommit) {
      await payload.db.commitTransaction(id)
    } else {
      await payload.db.rollbackTransaction(id)
    }
  } finally {
    if (payload.db.sessions?.[id]) {
      await payload.db.rollbackTransaction(id)
    }
  }
}

const revision = async ({
  data,
  req,
  target,
}: {
  data: Record<string, unknown>
  req: PayloadRequest
  target: { collection: string; parentID?: number | string }
}) => {
  const timestamp = new Date().toISOString()
  const args = {
    branchMode: true as const,
    createdAt: timestamp,
    updatedAt: timestamp,
    req,
    versionData: data,
  }
  const row =
    target.parentID === undefined
      ? await req.payload.db.createGlobalVersion({ ...args, globalSlug: settingsSlug })
      : await req.payload.db.createVersion({
          ...args,
          collectionSlug:
            req.payload.collections[target.collection]!.config.custom.branchHeadStorage
              .parentCollection,
          parent: target.parentID,
        })

  return initializeBranchVersion({
    branchID: 'main',
    isFrozen: false,
    req,
    target,
    versionID: row.id,
  })
}

const setHead = async ({
  branchID,
  req,
  scope,
  target,
  ref,
}: {
  branchID: string
  ref: { generation: number; id: number | string }
  req: PayloadRequest
  scope: typeof en | typeof shared
  target: { collection: string; parentID?: number | string }
}) => {
  const expected = await readBranchHeadToken({ branchID, req, scope, target })

  return writeBranchHead({
    expected,
    nextState: { type: 'version', version: ref, structure: null },
    req,
    target,
  })
}

const rawProjection = async ({
  branchID,
  payload,
  req,
  target,
}: {
  branchID: string
  payload: Payload
  req?: PayloadRequest
  target: { parentID: number | string }
}) =>
  payload.db.findOne<any>({
    collection: payload.collections[articlesSlug]!.config.custom.branchQueryStorage.projection,
    locale: 'all',
    req,
    where: { id: { equals: encodeBranchProjectionID({ branchID, logicalID: target.parentID }) } },
  })

const projection = async (args: {
  branchID: string
  payload: Payload
  req: PayloadRequest
  target: { parentID: number | string }
}): Promise<any> =>
  decodeBranchProjectionDocument({
    branchID: args.branchID,
    data: await rawProjection(args),
    fields: args.payload.collections[articlesSlug]!.config.fields,
    projectionSlugs: {},
  })
