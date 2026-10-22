/* eslint-disable payload/no-relative-monorepo-imports -- Verify private ownership state through genuine public autosaves. */
import type { Payload, PayloadRequest } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { createSelectedBranchRequest } from '../../packages/payload/src/versions/branches/operations/selectedBranchContext.js'
import { bootstrapBranchProjectionPage } from '../../packages/payload/src/versions/branches/queries/branchProjectionStore.js'
import {
  commitBranchAutosaveHeads,
  readBranchHead,
  readBranchHeads,
} from '../../packages/payload/src/versions/branches/storage/branchHeadStore.js'
import { pinBranchVersion } from '../../packages/payload/src/versions/branches/storage/branchVersionStore.js'
import { test } from '../__helpers/int/vitest.js'
import { nativeBranchDatabaseOptions } from './adapterCapabilities.js'
import { articlesSlug, queryDocsSlug, scalarArticlesSlug, settingsSlug } from './slugs.js'

test.suite(
  'Branch autosave ownership',
  { config: './config.ts', ...nativeBranchDatabaseOptions },
  () => {
    for (const isActivated of [false, true]) {
      test(`should reuse the ${isActivated ? 'activated' : 'released'} autosave identity while alternating locales`, async ({
        payload,
      }) => {
        if (isActivated) {
          await activateEmpty({ collection: articlesSlug, payload })
        }
        const article = await payload.create({
          collection: articlesSlug,
          data: { _status: 'published', title: 'live English' },
          locale: 'en',
        })

        await payload.update({
          collection: articlesSlug,
          id: article.id,
          data: { _status: 'published', title: 'live French' },
          locale: 'fr',
        })
        let autosaveID: number | string | undefined
        let versionCount: number | undefined

        for (const [locale, title] of [
          ['en', 'working English'],
          ['fr', 'working French'],
          ['en', 'new English'],
          ['fr', 'new French'],
        ] as const) {
          await payload.update({
            collection: articlesSlug,
            id: article.id,
            data: { title },
            locale,
            draft: true,
            autosave: true,
          })
          const versions = await payload.findVersions({
            collection: articlesSlug,
            where: { parent: { equals: article.id } },
            sort: '-updatedAt',
          })

          autosaveID ??= versions.docs[0]!.id
          versionCount ??= versions.totalDocs
          expect(versions.docs[0]!.id).toBe(autosaveID)
          expect(versions.totalDocs).toBe(versionCount)
        }
        const working = await payload.findByID({
          collection: articlesSlug,
          id: article.id,
          locale: 'all',
          depth: 0,
          draft: true,
        })
        const live = await payload.findByID({
          collection: articlesSlug,
          id: article.id,
          locale: 'all',
          depth: 0,
        })

        expect(working.title).toEqual({ en: 'new English', fr: 'new French' })
        expect(live.title).toEqual({ en: 'live English', fr: 'live French' })
      })
    }
    for (const isActivated of [false, true]) {
      test(`should preserve ${isActivated ? 'activated' : 'released'} writes when the autosave storage feature is disabled`, async ({
        payload,
      }) => {
        if (isActivated) {
          await activateEmpty({ collection: scalarArticlesSlug, payload })
        }
        const article = await payload.create({
          collection: scalarArticlesSlug,
          data: { title: 'live', _status: 'published' },
          depth: 0,
        })
        const before = await payload.findVersions({
          collection: scalarArticlesSlug,
          where: { parent: { equals: article.id } },
        })

        for (const title of ['one', 'two']) {
          await payload.update({
            collection: scalarArticlesSlug,
            id: article.id,
            data: { title },
            draft: true,
            autosave: true,
            depth: 0,
          })
        }
        const after = await payload.findVersions({
          collection: scalarArticlesSlug,
          where: { parent: { equals: article.id } },
        })

        expect(after.totalDocs).toBe(before.totalDocs + 2)
        expect(
          await payload.findByID({
            collection: scalarArticlesSlug,
            id: article.id,
            draft: true,
            depth: 0,
          }),
        ).toMatchObject({ title: 'two' })
        expect(
          await payload.findByID({ collection: scalarArticlesSlug, id: article.id, depth: 0 }),
        ).toMatchObject({ title: 'live' })
      })
    }

    test('should coalesce alternating global locales while preserving ordinary localized content', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })
      await activateEmpty({ collection: queryDocsSlug, payload })
      await activateEmpty({ global: settingsSlug, payload })
      await payload.updateGlobal({
        slug: settingsSlug,
        data: { title: 'English live', _status: 'published' },
        locale: 'en',
        depth: 0,
      })
      await payload.updateGlobal({
        slug: settingsSlug,
        data: { title: 'French live', _status: 'published' },
        locale: 'fr',
        depth: 0,
      })
      let firstID: number | string | undefined
      let count: number | undefined

      for (const [index, [locale, title]] of [
        ['en', 'English working'],
        ['fr', 'French working'],
        ['en', 'English final'],
      ].entries()) {
        await payload.updateGlobal({
          slug: settingsSlug,
          data: { title },
          locale,
          draft: true,
          autosave: true,
          depth: 0,
        })
        const versions = await payload.findGlobalVersions({
          slug: settingsSlug,
          locale: 'all',
          sort: '-updatedAt',
        })
        const native = await payload.db.findGlobalVersions({
          global: settingsSlug,
          locale: 'all',
          where: { id: { equals: versions.docs[0]!.id } },
        })

        firstID ??= native.docs[0]!.id
        count ??= versions.totalDocs
        expect(native.docs[0]).toMatchObject({
          id: firstID,
          branchFrozen: false,
          branchGeneration: index + 1,
        })
        expect(versions.totalDocs).toBe(count)
      }
      const working = await payload.db.findGlobalVersions({
        global: settingsSlug,
        locale: 'all',
        where: { id: { equals: firstID } },
      })
      const live = await payload.db.findGlobal({ slug: settingsSlug, locale: 'all' })

      expect(working.docs[0]!.version.title).toEqual({ en: 'English final', fr: 'French working' })
      expect(live?.title).toEqual({ en: 'English live', fr: 'French live' })
    })

    test('should preserve canonical nested rows while advancing both locale content heads', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })
      const article = await payload.create({
        collection: articlesSlug,
        data: {
          _status: 'published',
          title: 'live',
          sections: [{ id: 'section-a', label: 'shared live', translation: 'English live' }],
        },
        locale: 'en',
        depth: 0,
      })

      await payload.update({
        collection: articlesSlug,
        id: article.id,
        data: {
          title: 'French live',
          sections: [{ id: 'section-a', label: 'shared live', translation: 'French live' }],
        },
        locale: 'fr',
        depth: 0,
      })
      let firstID: number | string | undefined
      let count: number | undefined

      for (const [locale, translation] of [
        ['en', 'English working'],
        ['fr', 'French working'],
        ['en', 'English final'],
      ] as const) {
        await payload.update({
          collection: articlesSlug,
          id: article.id,
          data: { sections: [{ id: 'section-a', label: 'shared working', translation }] },
          locale,
          draft: true,
          autosave: true,
          depth: 0,
        })
        const versions = await payload.findVersions({
          collection: articlesSlug,
          sort: '-updatedAt',
          where: { parent: { equals: article.id } },
        })

        firstID ??= versions.docs[0]!.id
        count ??= versions.totalDocs
        expect(versions.docs[0]!.id).toBe(firstID)
        expect(versions.totalDocs).toBe(count)
      }
      const working = await payload.findByID({
        collection: articlesSlug,
        id: article.id,
        draft: true,
        locale: 'all',
        depth: 0,
      })
      const live = await payload.findByID({
        collection: articlesSlug,
        id: article.id,
        locale: 'all',
        depth: 0,
      })
      const versions = await payload.db.findVersions({
        collection: articlesSlug,
        locale: 'all',
        where: { id: { equals: firstID } },
      })

      expect(working.sections).toEqual([
        {
          id: 'section-a',
          label: 'shared working',
          translation: { en: 'English final', fr: 'French working' },
        },
      ])
      expect(versions.docs[0]!.version.sections).toEqual(working.sections)
      expect(live.sections).toEqual([
        {
          id: 'section-a',
          label: 'shared live',
          translation: { en: 'English live', fr: 'French live' },
        },
      ])
    })

    test('should coalesce named autosaves without stealing managed drafts latest or history', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })
      const article = await payload.create({
        collection: articlesSlug,
        data: { _status: 'published', title: 'live' },
        locale: 'en',
        depth: 0,
      })

      await payload.update({
        collection: articlesSlug,
        id: article.id,
        data: { title: 'managed working' },
        locale: 'en',
        draft: true,
        autosave: true,
        depth: 0,
      })
      const managed = await latestAutosave({ payload, id: article.id })
      const before = await payload.findVersions({
        collection: articlesSlug,
        where: { parent: { equals: article.id } },
      })
      const config = payload.collections[articlesSlug]!.config

      await inTransaction({
        payload,
        run: async ({ req }) => {
          await bootstrapBranchProjectionPage({
            branchID: 'staging',
            collection: config.custom.branchStorage.heads,
            req,
          })
        },
      })
      const req = createSelectedBranchRequest({
        branchID: 'staging',
        req: await createPayloadRequest({ payload }),
      })
      let namedID: number | string | undefined

      for (const [index, title] of ['staging one', 'staging two'].entries()) {
        await payload.update({
          collection: articlesSlug,
          id: article.id,
          data: { title },
          locale: 'en',
          draft: true,
          autosave: true,
          depth: 0,
          req,
        })
        const named = await payload.db.findVersions({
          collection: articlesSlug,
          locale: 'all',
          where: {
            parent: { equals: article.id },
            branchOnly: { equals: true },
            autosave: { equals: true },
          },
        })

        namedID ??= named.docs[0]!.id
        expect(named.docs).toHaveLength(1)
        expect(named.docs[0]).toMatchObject({
          id: namedID,
          branchGeneration: index + 1,
          branchFrozen: false,
          latest: false,
          version: { title: { en: title } },
        })
      }
      const after = await payload.findVersions({
        collection: articlesSlug,
        where: { parent: { equals: article.id } },
      })
      const currentManaged = await payload.db.findVersions({
        collection: articlesSlug,
        where: { id: { equals: managed.id } },
        locale: 'all',
      })

      expect(after.totalDocs).toBe(before.totalDocs)
      expect(currentManaged.docs[0]).toEqual(managed)
    })

    test('should roll back a partial mutable-head advance instead of leaving an old-generation locale', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })
      const article = await payload.create({
        collection: articlesSlug,
        data: { _status: 'published', title: 'live' },
        locale: 'en',
        depth: 0,
      })

      for (const locale of ['en', 'fr'] as const) {
        await payload.update({
          collection: articlesSlug,
          id: article.id,
          data: { title: locale },
          locale,
          autosave: true,
          draft: true,
          depth: 0,
        })
      }
      const before = await latestAutosave({ payload, id: article.id })
      const target = {
        collection: payload.collections[articlesSlug]!.config.custom.branchStorage.heads,
        parentID: article.id,
      }

      await expect(
        inTransaction({
          payload,
          run: async ({ req }) => {
            const readSet = await readBranchHeads({
              req,
              target,
              selections: ['en', 'fr'].map((locale) => ({
                branchID: 'drafts',
                scope: { type: 'locale' as const, locale },
              })),
            })
            const expected = readSet[0]!

            await commitBranchAutosaveHeads({
              branchID: 'drafts',
              readSet,
              req,
              target,
              prepare: async ({ replace }) => {
                const reference = await replace({
                  data: { ...before.version, title: { en: 'partial', fr: 'fr' } },
                  expected: { id: before.id, generation: before.branchGeneration as number },
                  updatedAt: new Date().toISOString(),
                  latest: true,
                })

                if (expected.state?.type !== 'version') {
                  throw new Error('Expected the real mutable head.')
                }

                return {
                  reference,
                  version: before,
                  changes: [{ expected, nextState: { ...expected.state, version: reference } }],
                }
              },
            })
          },
        }),
      ).rejects.toThrow('complete content ownership closure')
      expect(await latestAutosave({ payload, id: article.id })).toEqual(before)
      expect(
        await payload.findByID({
          collection: articlesSlug,
          id: article.id,
          locale: 'all',
          draft: true,
          depth: 0,
        }),
      ).toMatchObject({ title: { en: 'en', fr: 'fr' } })
    })

    test('should revoke a captured mutation capability without adopting a committed unattached row', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })
      const article = await payload.create({
        collection: articlesSlug,
        data: { title: 'live', _status: 'published' },
        locale: 'en',
        depth: 0,
      })

      await payload.update({
        collection: articlesSlug,
        id: article.id,
        data: { title: 'owned' },
        draft: true,
        autosave: true,
        locale: 'en',
        depth: 0,
      })
      const before = await latestAutosave({ payload, id: article.id })
      const now = new Date().toISOString()
      const unattached = await payload.db.createVersion({
        collectionSlug: articlesSlug,
        parent: article.id,
        autosave: true,
        branchMode: true,
        createdAt: now,
        updatedAt: now,
        versionData: { title: { en: 'unattached' } },
      })
      const target = {
        collection: payload.collections[articlesSlug]!.config.custom.branchStorage.heads,
        parentID: article.id,
      }
      let escaped: (() => Promise<unknown>) | undefined

      await expect(
        inTransaction({
          payload,
          run: async ({ req }) => {
            const readSet = await readBranchHeads({
              req,
              target,
              selections: [{ branchID: 'drafts', scope: { type: 'locale', locale: 'en' } }],
            })

            await commitBranchAutosaveHeads({
              branchID: 'drafts',
              readSet,
              req,
              target,
              prepare: ({ initialize }) => {
                escaped = () => initialize({ versionID: unattached.id })

                return Promise.resolve({
                  changes: [],
                  reference: { id: before.id, generation: before.branchGeneration as number },
                  version: before,
                })
              },
            })
          },
        }),
      ).rejects.toThrow('native generation CAS')
      expect(escaped).toBeDefined()
      await expect(escaped!()).rejects.toThrow('operation-scoped native mutation')
      const after = await payload.db.findVersions({
        collection: articlesSlug,
        locale: 'all',
        where: { id: { equals: unattached.id } },
      })

      expect(after.docs[0]).toEqual(unattached)
      const owner = await payload.db.findVersions({
        collection: articlesSlug,
        locale: 'all',
        where: { id: { equals: before.id } },
      })

      expect(owner.docs[0]).toEqual(before)
    })

    for (const firstCommitIndex of [undefined, 0, 1]) {
      test(`should serialize actual owned-head ${firstCommitIndex === undefined ? 'competing autosaves' : firstCommitIndex === 0 ? 'pin-before-replacement' : 'replacement-before-pin'}`, async ({
        payload,
      }) => {
        await activateEmpty({ collection: articlesSlug, payload })
        const article = await payload.create({
          collection: articlesSlug,
          data: { title: 'live', _status: 'published' },
          locale: 'en',
          depth: 0,
        })

        await payload.update({
          collection: articlesSlug,
          id: article.id,
          data: { title: 'owned' },
          draft: true,
          autosave: true,
          locale: 'en',
          depth: 0,
        })
        const before = await latestAutosave({ payload, id: article.id })
        const target = {
          collection: payload.collections[articlesSlug]!.config.custom.branchStorage.heads,
          parentID: article.id,
        }
        const results = await competeOwnedAutosave({
          firstCommitIndex,
          payload,
          target,
          version: before,
        })
        const committed = results.filter(({ isCommitted }) => isCommitted)
        const after = await payload.db.findVersions({
          collection: articlesSlug,
          locale: 'all',
          where: { id: { equals: before.id } },
        })
        const pins = await payload.db.find({
          collection: payload.collections[articlesSlug]!.config.custom.branchStorage.pins,
          where: { versionID: { equals: before.id } },
        })
        const isPinWinner = firstCommitIndex === 0

        expect(committed).toHaveLength(1)
        expect(after.docs[0]).toMatchObject({
          branchGeneration: (before.branchGeneration as number) + (isPinWinner ? 0 : 1),
          branchFrozen: isPinWinner,
          version: { title: { en: isPinWinner ? 'owned' : `winner ${committed[0]!.index}` } },
        })
        expect(pins.docs).toHaveLength(isPinWinner ? 1 : 0)
        expect(
          await payload.findByID({
            collection: articlesSlug,
            id: article.id,
            draft: true,
            locale: 'en',
            depth: 0,
          }),
        ).toMatchObject({ title: isPinWinner ? 'owned' : `winner ${committed[0]!.index}` })
      })
    }

    test('should advance exclusive autosave generations and native history timestamps with hooks once', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })
      const article = await payload.create({
        collection: articlesSlug,
        data: { _status: 'published', title: 'live' },
        locale: 'en',
        depth: 0,
      })
      const config = payload.collections[articlesSlug]!.config
      const previous = config.hooks.beforeChange
      let calls = 0

      config.hooks.beforeChange = [
        ...previous,
        ({ data }) => {
          calls++
          return data
        },
      ]
      try {
        let firstID: number | string | undefined
        let generation = 0
        let previousUpdatedAt: string | undefined

        for (const title of ['first', 'second', 'third']) {
          await payload.update({
            collection: articlesSlug,
            id: article.id,
            data: { title },
            draft: true,
            autosave: true,
            locale: 'en',
            depth: 0,
          })
          const versions = await payload.db.findVersions({
            collection: articlesSlug,
            locale: 'all',
            sort: '-updatedAt',
            where: { parent: { equals: article.id }, autosave: { equals: true } },
          })
          const row = versions.docs[0]!

          firstID ??= row.id
          expect(row.id).toBe(firstID)
          expect(row.branchGeneration).toBe(++generation)
          expect(row.branchFrozen).toBe(false)
          expect(row.updatedAt).toBe(row.version.updatedAt)
          expect(Date.parse(row.updatedAt)).toBeGreaterThanOrEqual(
            Date.parse(previousUpdatedAt ?? row.updatedAt),
          )
          previousUpdatedAt = row.updatedAt
          expect(row.version.title).toMatchObject({ en: title })
          expect(versions.docs).toHaveLength(1)
        }
        expect(calls).toBe(3)
      } finally {
        config.hooks.beforeChange = previous
      }
    })

    test('should freeze retired manual-save history and create a new mutable owner afterward', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })
      const article = await payload.create({
        collection: articlesSlug,
        data: { title: 'live', _status: 'published' },
        locale: 'en',
        depth: 0,
      })

      await payload.update({
        collection: articlesSlug,
        id: article.id,
        data: { title: 'autosaved history' },
        autosave: true,
        draft: true,
        locale: 'en',
        depth: 0,
      })
      const retired = await latestAutosave({ payload, id: article.id })

      await payload.update({
        collection: articlesSlug,
        id: article.id,
        data: { title: 'manual immutable' },
        draft: true,
        locale: 'en',
        depth: 0,
      })
      const manual = await payload.db.findVersions({
        collection: articlesSlug,
        locale: 'all',
        sort: '-updatedAt',
        where: { parent: { equals: article.id }, branchOnly: { not_equals: true } },
      })

      expect(manual.docs[0]).toMatchObject({
        autosave: false,
        branchFrozen: true,
        version: { title: { en: 'manual immutable' } },
      })
      await payload.update({
        collection: articlesSlug,
        id: article.id,
        data: { title: 'new autosave' },
        autosave: true,
        draft: true,
        locale: 'en',
        depth: 0,
      })
      const after = await latestAutosave({ payload, id: article.id })
      const history = await payload.db.findVersions({
        collection: articlesSlug,
        locale: 'all',
        where: { id: { equals: retired.id } },
      })

      expect(after.id).not.toBe(retired.id)
      expect(history.docs[0]).toMatchObject({
        branchFrozen: true,
        branchGeneration: retired.branchGeneration,
        version: retired.version,
      })
    })

    test('should freeze a pinned autosave and preserve its exact body through copy on write', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })
      const article = await payload.create({
        collection: articlesSlug,
        data: { _status: 'published', title: 'live' },
        locale: 'en',
        depth: 0,
      })

      await payload.update({
        collection: articlesSlug,
        id: article.id,
        data: { title: 'pinned' },
        draft: true,
        autosave: true,
        locale: 'en',
        depth: 0,
      })
      const before = await latestAutosave({ payload, id: article.id })
      const config = payload.collections[articlesSlug]!.config

      await inTransaction({
        payload,
        run: async ({ req }) => {
          await pinBranchVersion({
            reference: { id: before.id, generation: before.branchGeneration as number },
            req,
            rootKey: 'exact-preview',
            target: { collection: config.custom.branchStorage.heads, parentID: article.id },
          })
        },
      })
      await payload.update({
        collection: articlesSlug,
        id: article.id,
        data: { title: 'after pin' },
        draft: true,
        autosave: true,
        locale: 'en',
        depth: 0,
      })
      const after = await latestAutosave({ payload, id: article.id })
      const old = await payload.db.findVersions({
        collection: articlesSlug,
        locale: 'all',
        where: { id: { equals: before.id } },
      })

      expect(after.id).not.toBe(before.id)
      expect(after.branchFrozen).toBe(false)
      expect(old.docs[0]).toMatchObject({
        branchFrozen: true,
        branchGeneration: before.branchGeneration,
        version: before.version,
      })
    })

    test('should retain a frozen unselected locale while a selected locale uses copy on write', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })
      const article = await payload.create({
        collection: articlesSlug,
        data: { _status: 'published', title: 'live' },
        locale: 'en',
        depth: 0,
      })

      await payload.update({
        collection: articlesSlug,
        id: article.id,
        data: { title: 'English' },
        draft: true,
        autosave: true,
        locale: 'en',
        depth: 0,
      })
      await payload.update({
        collection: articlesSlug,
        id: article.id,
        data: { title: 'French' },
        draft: true,
        autosave: true,
        locale: 'fr',
        depth: 0,
      })
      const before = await latestAutosave({ payload, id: article.id })
      const config = payload.collections[articlesSlug]!.config
      const target = { collection: config.custom.branchStorage.heads, parentID: article.id }
      const req = await createPayloadRequest({ payload })
      const french = await readBranchHead({
        branchID: 'drafts',
        req,
        scope: { type: 'locale', locale: 'fr' },
        target,
      })

      await inTransaction({
        payload,
        run: async ({ req }) => {
          await pinBranchVersion({
            reference: { id: before.id, generation: before.branchGeneration as number },
            req,
            rootKey: 'locale-schedule',
            target,
          })
        },
      })
      await payload.update({
        collection: articlesSlug,
        id: article.id,
        data: { title: 'new English' },
        draft: true,
        autosave: true,
        locale: 'en',
        depth: 0,
      })
      const retained = await readBranchHead({
        branchID: 'drafts',
        req,
        scope: { type: 'locale', locale: 'fr' },
        target,
      })
      const working = await payload.findByID({
        collection: articlesSlug,
        id: article.id,
        draft: true,
        locale: 'all',
        depth: 0,
      })

      expect(retained).toEqual(french)
      expect(working.title).toEqual({ en: 'new English', fr: 'French' })
      expect((await latestAutosave({ payload, id: article.id })).id).not.toBe(before.id)
    })

    test('should roll back the first inherited autosave and its private shared checkpoint', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })
      const article = await payload.create({
        collection: articlesSlug,
        data: { title: 'live', shared: 'live shared', _status: 'published' },
        locale: 'en',
        depth: 0,
      })
      const config = payload.collections[articlesSlug]!.config
      const before = await payload.db.findVersions({
        collection: articlesSlug,
        locale: 'all',
        pagination: false,
        sort: 'id',
        where: { parent: { equals: article.id } },
      })
      const heads = await payload.db.find({
        collection: config.custom.branchStorage.heads,
        pagination: false,
        sort: 'id',
      })
      const req = await createPayloadRequest({ payload })
      const transactionID = await payload.db.beginTransaction()

      if (transactionID == null) {
        throw new Error('A native transaction is required.')
      }
      req.transactionID = transactionID
      try {
        await payload.update({
          collection: articlesSlug,
          id: article.id,
          data: { title: 'rolled back', shared: 'uncommitted shared' },
          draft: true,
          autosave: true,
          locale: 'en',
          depth: 0,
          req,
        })
        const inside = await payload.db.findVersions({
          collection: articlesSlug,
          req,
          locale: 'all',
          where: {
            parent: { equals: article.id },
            'version.shared': { equals: 'uncommitted shared' },
          },
        })

        expect(inside.docs).toHaveLength(2)
        expect(inside.docs.map(({ branchFrozen }) => branchFrozen).sort()).toEqual([false, true])
      } finally {
        await payload.db.rollbackTransaction(transactionID)
      }
      const after = await payload.db.findVersions({
        collection: articlesSlug,
        locale: 'all',
        pagination: false,
        sort: 'id',
        where: { parent: { equals: article.id } },
      })

      expect(after.docs).toEqual(before.docs)
      expect(
        (
          await payload.db.find({
            collection: config.custom.branchStorage.heads,
            pagination: false,
            sort: 'id',
          })
        ).docs,
      ).toEqual(heads.docs)
      expect(
        await payload.findByID({
          collection: articlesSlug,
          id: article.id,
          draft: true,
          locale: 'en',
          depth: 0,
        }),
      ).toMatchObject({ title: 'live', shared: 'live shared' })
    })

    test('should roll back in-place body, head, timestamp and latest changes in the caller transaction', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })
      const article = await payload.create({
        collection: articlesSlug,
        data: { _status: 'published', title: 'live' },
        locale: 'en',
        depth: 0,
      })

      await payload.update({
        collection: articlesSlug,
        id: article.id,
        data: { title: 'committed' },
        draft: true,
        autosave: true,
        locale: 'en',
        depth: 0,
      })
      const before = await latestAutosave({ payload, id: article.id })
      const config = payload.collections[articlesSlug]!.config
      const heads = await payload.db.find({
        collection: config.custom.branchStorage.heads,
        pagination: false,
        sort: 'id',
      })
      const req = await createPayloadRequest({ payload })
      const transactionID = await payload.db.beginTransaction()

      if (transactionID == null) {
        throw new Error('A native transaction is required.')
      }
      req.transactionID = transactionID
      try {
        await payload.update({
          collection: articlesSlug,
          id: article.id,
          data: { title: 'rolled back' },
          draft: true,
          autosave: true,
          locale: 'en',
          depth: 0,
          req,
        })
        const inside = await payload.db.findVersions({
          collection: articlesSlug,
          req,
          locale: 'all',
          where: { id: { equals: before.id } },
        })

        expect(inside.docs[0]).toMatchObject({
          branchGeneration: (before.branchGeneration as number) + 1,
          version: { title: { en: 'rolled back' } },
        })
      } finally {
        await payload.db.rollbackTransaction(transactionID)
      }
      expect(await latestAutosave({ payload, id: article.id })).toEqual(before)
      expect(
        (
          await payload.db.find({
            collection: config.custom.branchStorage.heads,
            pagination: false,
            sort: 'id',
          })
        ).docs,
      ).toEqual(heads.docs)
      expect(
        await payload.findByID({
          collection: articlesSlug,
          id: article.id,
          draft: true,
          locale: 'en',
          depth: 0,
        }),
      ).toMatchObject({ title: 'committed' })
    })

    test('should reject stale autosave observations after a nested hook edit without replaying hooks', async ({
      payload,
    }) => {
      await activateEmpty({ collection: articlesSlug, payload })
      const article = await payload.create({
        collection: articlesSlug,
        data: { _status: 'published', title: 'live' },
        locale: 'en',
        depth: 0,
      })

      await payload.update({
        collection: articlesSlug,
        id: article.id,
        data: { title: 'committed' },
        draft: true,
        autosave: true,
        locale: 'en',
        depth: 0,
      })
      const config = payload.collections[articlesSlug]!.config
      const previous = config.hooks.beforeChange
      let isNested = false
      let calls = 0

      config.hooks.beforeChange = [
        ...previous,
        async ({ data, req }) => {
          if (!isNested) {
            calls++
            isNested = true
            try {
              await payload.update({
                collection: articlesSlug,
                id: article.id,
                data: { title: 'nested' },
                draft: true,
                autosave: true,
                locale: 'en',
                depth: 0,
                req,
              })
            } finally {
              isNested = false
            }
          }
          return data
        },
      ]
      try {
        await expect(
          payload.update({
            collection: articlesSlug,
            id: article.id,
            data: { title: 'outer' },
            draft: true,
            autosave: true,
            locale: 'en',
            depth: 0,
          }),
        ).rejects.toThrow('observation changed')
        expect(calls).toBe(1)
        expect(
          await payload.findByID({
            collection: articlesSlug,
            id: article.id,
            draft: true,
            locale: 'en',
            depth: 0,
          }),
        ).toMatchObject({ title: 'committed' })
      } finally {
        config.hooks.beforeChange = previous
      }
    })
  },
)

const activateEmpty = async ({
  collection,
  global,
  payload,
}: {
  collection?: string
  global?: string
  payload: Payload
}): Promise<void> => {
  const config = collection
    ? payload.collections[collection]!.config
    : payload.globals.config.find(({ slug }) => slug === global)!

  await payload.db.create({
    collection: config.custom.branchStorage.cutover,
    data: {
      singleton: 'authoritative',
      schemaGeneration: 1,
      migrationID: 'autosave-empty-source',
      generation: 1,
      isActivated: true,
    },
  })
  const req = await createPayloadRequest({ payload })
  const transactionID = await payload.db.beginTransaction()

  if (transactionID == null) {
    throw new Error('Autosave tests require native caller transactions.')
  }
  req.transactionID = transactionID

  try {
    for (const branchID of ['main', 'drafts']) {
      await bootstrapBranchProjectionPage({
        branchID,
        collection: config.custom.branchStorage.heads,
        req,
      })
    }
    await payload.db.commitTransaction(transactionID)
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

const latestAutosave = async ({ id, payload }: { id: number | string; payload: Payload }) => {
  const result = await payload.db.findVersions({
    collection: articlesSlug,
    locale: 'all',
    sort: '-updatedAt',
    where: { parent: { equals: id }, autosave: { equals: true } },
  })

  return result.docs[0]!
}

const inTransaction = async ({
  payload,
  run,
}: {
  payload: Payload
  run: (args: { req: Awaited<ReturnType<typeof createPayloadRequest>> }) => Promise<void>
}): Promise<void> => {
  const req = await createPayloadRequest({ payload })
  const transactionID = await payload.db.beginTransaction()

  if (transactionID == null) {
    throw new Error('A native transaction is required.')
  }
  req.transactionID = transactionID
  try {
    await run({ req })
    await payload.db.commitTransaction(transactionID)
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

/** libSQL BEGIN IMMEDIATE serializes writers; its contenders observe before beginning. */
const competeOwnedAutosave = async ({
  firstCommitIndex,
  payload,
  target,
  version,
}: {
  firstCommitIndex?: number
  payload: Payload
  target: { collection: string; parentID: number | string }
  version: Awaited<ReturnType<typeof latestAutosave>>
}): Promise<{ index: number; isCommitted: boolean }[]> => {
  let release!: () => void
  let finishFirst!: () => void
  const observed = new Promise<void>((resolve) => {
    release = resolve
  })
  const firstFinished = new Promise<void>((resolve) => {
    finishFirst = resolve
  })
  let arrivals = 0
  const observe = async ({ req }: { req: PayloadRequest }) => {
    const readSet = await readBranchHeads({
      req,
      target,
      selections: ['main', 'drafts'].flatMap((branchID) => [
        { branchID, scope: { type: 'shared' as const } },
        ...['en', 'fr'].map((locale) => ({ branchID, scope: { type: 'locale' as const, locale } })),
      ]),
    })

    arrivals++
    if (arrivals === 2) {
      release()
    }
    await observed

    return readSet
  }
  const results = await Promise.allSettled(
    [0, 1].map(async (index) => {
      try {
        let readSet: Awaited<ReturnType<typeof readBranchHeads>>

        if (payload.db.name === 'sqlite') {
          readSet = await observe({ req: await createPayloadRequest({ payload }) })
          if (firstCommitIndex !== undefined && index !== firstCommitIndex) {
            await firstFinished
          }
        }
        await inTransaction({
          payload,
          run: async ({ req }) => {
            if (payload.db.name !== 'sqlite') {
              readSet = await observe({ req })
              if (firstCommitIndex !== undefined && index !== firstCommitIndex) {
                await firstFinished
              }
            }
            const expected = readSet!.find(
              (token) =>
                token.branchID === 'drafts' &&
                token.scope.type === 'locale' &&
                token.scope.locale === 'en',
            )!
            const reference = { id: version.id, generation: version.branchGeneration as number }

            if (firstCommitIndex !== undefined && index === 0) {
              await pinBranchVersion({ reference, req, rootKey: 'racing-owned-preview', target })
            } else {
              await commitBranchAutosaveHeads({
                branchID: 'drafts',
                readSet: readSet!,
                req,
                target,
                prepare: async ({ replace }) => {
                  const reference = await replace({
                    data: { ...version.version, title: { en: `winner ${index}` } },
                    expected: { id: version.id, generation: version.branchGeneration as number },
                    updatedAt: new Date().toISOString(),
                    latest: true,
                  })

                  if (expected.state?.type !== 'version') {
                    throw new Error('Expected an owned mutable head.')
                  }

                  return {
                    reference,
                    version,
                    changes: [{ expected, nextState: { ...expected.state, version: reference } }],
                  }
                },
              })
            }
          },
        })

        return { index, isCommitted: true }
      } catch (error) {
        release()
        if (!isAutosaveConflict({ error })) {
          throw error
        }

        return { index, isCommitted: false }
      } finally {
        if (index === firstCommitIndex) {
          finishFirst()
        }
      }
    }),
  )

  return results.map((result) => {
    if (result.status === 'rejected') {
      throw result.reason
    }

    return result.value
  })
}

const isAutosaveConflict = ({ error }: { error: unknown }): boolean => {
  if (!error || typeof error !== 'object') {
    return false
  }
  const { cause, code, message } = error as { cause?: unknown; code?: unknown; message?: unknown }

  return (
    ['40P01', 112, '40001', 'SQLITE_BUSY', 'SQLITE_BUSY_SNAPSHOT'].includes(
      code as number | string,
    ) ||
    (typeof message === 'string' &&
      ([
        'Autosave version revision changed or was pinned concurrently.',
        'Branch batch observation changed; roll back the caller transaction.',
        'Cannot pin a missing, wrong-parent, unmanaged, or stale version revision.',
      ].includes(message) ||
        message.startsWith('Error: cannot begin transaction: SQLITE_BUSY:'))) ||
    isAutosaveConflict({ error: cause })
  )
}
