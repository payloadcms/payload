/* eslint-disable payload/no-relative-monorepo-imports -- Exercise native effective relations against current draft queries. */
import type { Payload, PayloadRequest, SelectType, Where } from 'payload'

import { appendVersionToQueryKey, createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import {
  invalidateBranchProjection,
  settleBranchProjectionInvalidation,
} from '../../packages/payload/src/versions/branches/queries/branchProjectionGuard.js'
import { bootstrapBranchProjectionPage } from '../../packages/payload/src/versions/branches/queries/branchProjectionStore.js'
import {
  countBranchContent,
  findDistinctBranchContent,
} from '../../packages/payload/src/versions/branches/queries/queryBranchAggregates.js'
import { queryBranchContent } from '../../packages/payload/src/versions/branches/queries/queryBranchContent.js'
import { queryBranchContentGraph } from '../../packages/payload/src/versions/branches/queries/queryBranchContentGraph.js'
import {
  readBranchHeadToken,
  writeBranchHead,
} from '../../packages/payload/src/versions/branches/storage/branchHeadStore.js'
import { initializeBranchVersion } from '../../packages/payload/src/versions/branches/storage/branchVersionStore.js'
import { test } from '../__helpers/int/vitest.js'
import { nativeBranchDatabaseOptions } from './adapterCapabilities.js'
import { queryDocsSlug, queryTagsSlug, queryTextTagsSlug } from './slugs.js'

const heads = `collection-${queryDocsSlug}-heads`
const branchID = 'staging'

test.suite(
  'Native effective branch query parity',
  { config: './config.ts', ...nativeBranchDatabaseOptions },
  () => {
    test('should preserve existing draft filtering, typed identity sorting, array operators and native paging', async ({
      payload,
    }) => {
      await seeded({
        payload,
        run: async ({ req }) => {
          const predicates: Where[] = [
            {},
            { id: { in: [1, 10] } },
            { rank: { greater_than: 1 } },
            { related: { equals: [2, 10] } },
            { related: { not_equals: [2, 10] } },
            { related: { in: [2] } },
            { related: { not_in: [2] } },
            { one: { exists: true } },
            { one: { equals: null } },
            { or: [{ 'one.rank': { greater_than: 1 } }, { rank: { equals: 2 } }] },
            { 'one.id': { equals: 2 } },
            { 'one.rank': { greater_than: 1 } },
            { poly: { equals: { relationTo: queryDocsSlug, value: 2 } } },
            { 'poly.value': { greater_than: 2 } },
            { 'sections.target.rank': { equals: 10 } },
            { 'content.label': { equals: 'Block 1' } },
            { or: [{ 'title.fr': { equals: 'French 1' } }, { rank: { equals: 10 } }] },
          ]
          for (const where of predicates) {
            const baseline = await payload.db.queryDrafts({
              collection: queryDocsSlug,
              req,
              locale: 'en',
              joins: false,
              pagination: true,
              sort: ['version.rank', 'parent'],
              where: appendVersionToQueryKey(where),
              limit: 2,
              page: 1,
            })
            const effective = await queryBranchContent({
              branchID,
              collection: queryDocsSlug,
              req,
              locale: 'en',
              joins: false,
              pagination: true,
              sort: ['rank', 'id'],
              where,
              limit: 2,
              page: 1,
            })
            expect(effective.docs.map(({ id }) => id)).toEqual(baseline.docs.map(({ id }) => id))
            expect(effective.totalDocs).toBe(baseline.totalDocs)
          }
          const sorted = await queryBranchContent({
            branchID,
            collection: queryDocsSlug,
            req,
            joins: false,
            locale: 'en',
            sort: 'id',
            limit: 1,
            page: 2,
          })
          expect(sorted.docs.map(({ id }) => id)).toEqual([2])
          expect(sorted.totalDocs).toBe(3)
          expect(sorted.docs[0]).not.toHaveProperty('_branchProjection')
        },
      })
    })

    test('should evaluate original entity and ordinary relationship access on effective content before count and paging', async ({
      payload,
    }) => {
      await seeded({
        payload,
        run: async ({ req }) => {
          req.context.queryDocAccess = { rank: { greater_than_equal: 2 } }
          const allowed = await queryBranchContent({
            branchID,
            collection: queryDocsSlug,
            req,
            locale: 'en',
            joins: false,
            sort: 'id',
            limit: 1,
          })
          expect(allowed.docs.map(({ id }) => id)).toEqual([2])
          expect(allowed.totalDocs).toBe(2)
          req.context.queryDocAccess = true
          req.context.queryTagAccess = false
          const denied = await queryBranchContent({
            branchID,
            collection: queryDocsSlug,
            req,
            locale: 'en',
            joins: false,
            where: { 'tag.title': { equals: 'Visible' } },
          })
          expect(denied.totalDocs).toBe(0)
          req.context.queryTagAccess = { id: { equals: 20 } }
          const visible = await queryBranchContent({
            branchID,
            collection: queryDocsSlug,
            req,
            locale: 'en',
            joins: false,
            where: { 'tag.title': { equals: 'Visible' } },
          })
          expect(visible.docs.map(({ id }) => id)).toEqual([1])
        },
      })
    })

    test('should route ordinary target policy relationships back through effective branch content and visibility', async ({
      payload,
    }) => {
      await seeded({
        payload,
        run: async ({ req }) => {
          const policies: Where[] = [
            { 'owner.title': { equals: 'English 1' } },
            { owner: { equals: 1 } },
            { owners: { contains: { title: { equals: 'English 1' } } } },
            { 'polyOwners.value': { equals: 1 } },
          ]
          for (const policy of policies) {
            req.context.queryTagAccess = policy
            const allowed = await queryBranchContent({
              branchID,
              collection: queryDocsSlug,
              req,
              locale: 'en',
              joins: false,
              where: { 'tag.title': { equals: 'Visible' } },
            })
            expect(allowed.docs.map(({ id }) => id)).toEqual([1])
          }
          req.context.queryTagAccess = { 'owner.title': { equals: 'English 1' } }
          const target = { collection: heads, parentID: 1 }
          const expected = await readBranchHeadToken({
            branchID,
            req,
            scope: { type: 'shared' },
            target,
          })
          await writeBranchHead({ expected, nextState: { type: 'withdrawn' }, req, target })
          const denied = await queryBranchContent({
            branchID,
            collection: queryTagsSlug,
            req,
            locale: 'en',
            joins: false,
          })
          expect(denied.totalDocs).toBe(0)
        },
      })
    })

    test('should count and return distinct typed logical relationship values natively', async ({
      payload,
    }) => {
      await seeded({
        payload,
        run: async ({ req }) => {
          expect(
            await countBranchContent({
              branchID,
              collection: queryDocsSlug,
              req,
              locale: 'en',
              where: { 'one.rank': { greater_than_equal: 2 } },
            }),
          ).toEqual({ totalDocs: 2 })
          const ids = await findDistinctBranchContent({
            branchID,
            collection: queryDocsSlug,
            req,
            locale: 'en',
            field: 'id',
            sort: '-id',
            limit: 2,
          })
          expect(ids.values).toEqual([{ id: 10 }, { id: 2 }])
          expect(ids.totalDocs).toBe(3)
          const related = await findDistinctBranchContent({
            branchID,
            collection: queryDocsSlug,
            req,
            locale: 'en',
            field: 'related',
            where: { id: { equals: 1 } },
          })
          expect(related.values).toEqual([{ related: 2 }, { related: 10 }])
          const poly = await findDistinctBranchContent({
            branchID,
            collection: queryDocsSlug,
            req,
            locale: 'en',
            field: 'poly',
            where: { id: { equals: 1 } },
          })
          expect(poly.values).toEqual([{ poly: { relationTo: queryDocsSlug, value: 2 } }])
          const polyValue = await findDistinctBranchContent({
            branchID,
            collection: queryDocsSlug,
            req,
            locale: 'en',
            field: 'poly.value',
            where: { id: { equals: 1 } },
          })
          expect(polyValue.values).toEqual([{ 'poly.value': 2 }])
        },
      })
    })

    test('should ignore shared fields named like locales while guarding actual localized access and sort paths', async ({
      payload,
    }) => {
      await seeded({
        payload,
        run: async ({ req }) => {
          const control = payload.collections[queryDocsSlug]!.config.custom.branchQueryStorage
          const dirty = await invalidateBranchProjection({
            branchID,
            control,
            logicalID: 1,
            req,
            scope: { type: 'locale', locale: 'fr' },
          })
          await settleBranchProjectionInvalidation({
            control,
            expected: dirty,
            hasStructuralConflict: true,
            req,
          })
          const unaffected = await queryBranchContent({
            branchID,
            collection: queryDocsSlug,
            req,
            locale: 'en',
            joins: false,
            where: { fr: { equals: 'Shared' } },
            sort: 'fr',
          })
          expect(unaffected.totalDocs).toBe(3)
          await expect(
            queryBranchContent({
              branchID,
              collection: queryDocsSlug,
              req,
              locale: 'en',
              joins: false,
              where: { 'title.fr': { equals: 'French 1' } },
            }),
          ).rejects.toMatchObject({ code: 'branch-structural-conflict' })
          await expect(
            queryBranchContent({
              branchID,
              collection: queryDocsSlug,
              req,
              locale: 'en',
              joins: false,
              sort: 'title.fr',
            }),
          ).rejects.toMatchObject({ code: 'branch-structural-conflict' })
          await expect(
            findDistinctBranchContent({
              branchID,
              collection: queryDocsSlug,
              req,
              locale: 'en',
              field: 'title.fr',
            }),
          ).rejects.toMatchObject({ code: 'branch-structural-conflict' })
          await expect(
            queryBranchContent({ branchID, collection: queryDocsSlug, req, locale: 'en' }),
          ).rejects.toMatchObject({ code: 'branch-structural-conflict' })
          await expect(
            queryBranchContent({
              branchID,
              collection: queryDocsSlug,
              req,
              locale: 'en',
              joins: { configuredBacklinks: false, backlinks: { sort: 'title.fr' } },
            }),
          ).rejects.toMatchObject({ code: 'branch-structural-conflict' })
          await expect(
            queryBranchContent({
              branchID,
              collection: queryDocsSlug,
              req,
              locale: 'en',
              joins: {
                configuredBacklinks: false,
                backlinks: { where: { 'title.fr': { equals: 'French 1' } } },
              },
            }),
          ).rejects.toMatchObject({ code: 'branch-structural-conflict' })
          const docsConfig = req.payload.collections[queryDocsSlug]!.config
          const tagsConfig = req.payload.collections[queryTagsSlug]!.config
          const mixedJoin = docsConfig.polymorphicJoins.find(
            ({ joinPath }) => joinPath === 'mixedBacklinks',
          )!
          const mixedSort = mixedJoin.field.defaultSort
          const docsSort = docsConfig.defaultSort
          const tagsSort = tagsConfig.defaultSort
          try {
            mixedJoin.field.defaultSort = undefined
            docsConfig.defaultSort = 'title.fr'
            tagsConfig.defaultSort = '-title'
            const result = await queryBranchContent({
              branchID,
              collection: queryDocsSlug,
              req,
              locale: 'en',
              sort: 'id',
              joins: { configuredBacklinks: false, backlinks: false, mixedBacklinks: {} },
            })
            expect(result.totalDocs).toBe(3)
          } finally {
            mixedJoin.field.defaultSort = mixedSort
            docsConfig.defaultSort = docsSort
            tagsConfig.defaultSort = tagsSort
          }
          const configuredJoin = Object.values(req.payload.collections[queryDocsSlug]!.config.joins)
            .flat()
            .find(({ joinPath }) => joinPath === 'configuredBacklinks')!
          const configuredWhere = configuredJoin.field.where
          configuredJoin.field.where = { 'title.fr': { equals: 'French 10' } }
          try {
            await expect(
              queryBranchContent({
                branchID,
                collection: queryDocsSlug,
                req,
                locale: 'en',
                joins: { configuredBacklinks: { sort: 'rank' } },
              }),
            ).rejects.toMatchObject({ code: 'branch-structural-conflict' })
          } finally {
            configuredJoin.field.where = configuredWhere
          }
          const config = req.payload.collections[queryDocsSlug]!.config
          const defaultSort = config.defaultSort
          config.defaultSort = 'title.fr'
          try {
            await expect(
              queryBranchContent({
                branchID,
                collection: queryDocsSlug,
                req,
                locale: 'en',
                joins: false,
              }),
            ).rejects.toMatchObject({ code: 'branch-structural-conflict' })
            expect(
              (await countBranchContent({ branchID, collection: queryDocsSlug, req, locale: 'en' }))
                .totalDocs,
            ).toBe(3)
          } finally {
            config.defaultSort = defaultSort
          }
          req.context.queryDocAccess = { 'title.fr': { equals: 'French 1' } }
          await expect(
            queryBranchContent({
              branchID,
              collection: queryDocsSlug,
              req,
              locale: 'en',
              joins: false,
            }),
          ).rejects.toMatchObject({ code: 'branch-structural-conflict' })
        },
      })
    })

    test('should preserve localized group and block-slug Select behavior against existing draft reads', async ({
      payload,
    }) => {
      await seeded({
        payload,
        run: async ({ req }) => {
          for (const select of [
            {},
            { id: true },
            { details: { heading: true } },
            { content: { 'query-note': { label: true } } },
            { sections: { label: true } },
          ] as SelectType[]) {
            const baseline = await payload.find({
              collection: queryDocsSlug,
              depth: 0,
              draft: true,
              joins: false,
              locale: 'all',
              req,
              where: { id: { equals: 1 } },
              select,
            })
            const effective = await queryBranchContent({
              branchID,
              collection: queryDocsSlug,
              locale: 'all',
              req,
              joins: false,
              where: { id: { equals: 1 } },
              select,
            })
            expect(effective.docs).toEqual(baseline.docs)
          }
        },
      })
    })

    test('should freeze selected, fallback and all-locale references through localized groups', async ({
      payload,
    }) => {
      await seeded({
        payload,
        run: async ({ req }) => {
          const single = await queryBranchContentGraph({
            branchID,
            collection: queryDocsSlug,
            depth: 1,
            locale: 'en',
            req,
            joins: false,
            where: { id: { equals: 2 } },
          })
          expect(() => single.graph.get({ collection: queryTagsSlug, id: 30 })).toThrow()
          const priorLocale = req.locale
          delete req.locale
          const defaultLocaleGraph = await queryBranchContentGraph({
            branchID,
            collection: queryDocsSlug,
            depth: 1,
            req,
            joins: false,
            where: { id: { equals: 1 } },
          })
          expect(defaultLocaleGraph.graph.get({ collection: queryTagsSlug, id: 20 })).toMatchObject(
            { id: 20 },
          )
          expect(req.locale).toBeUndefined()
          req.locale = priorLocale
          req.fallbackLocale = 'fr'
          const fallback = await queryBranchContentGraph({
            branchID,
            collection: queryDocsSlug,
            depth: 1,
            locale: 'en',
            req,
            joins: false,
            where: { id: { equals: 2 } },
          })
          expect(fallback.graph.get({ collection: queryTagsSlug, id: 30 })).toMatchObject({
            id: 30,
          })
          const all = await queryBranchContentGraph({
            branchID,
            collection: queryDocsSlug,
            depth: 1,
            locale: 'all',
            req,
            joins: false,
            where: { id: { equals: 2 } },
          })
          expect(all.graph.get({ collection: queryTagsSlug, id: 30 })).toMatchObject({ id: 30 })
        },
      })
    })

    test('should give access callbacks the requested locale without nested Local API reads changing it', async ({
      payload,
    }) => {
      await seeded({
        payload,
        run: async ({ req }) => {
          const config = payload.collections[queryDocsSlug]!.config
          const read = config.access.read
          const outerLocale = req.locale
          let calls = 0
          config.access.read = async ({ req: scoped }) => {
            calls++
            expect(scoped.locale).toBe('fr')
            await scoped.payload.find({
              collection: queryTagsSlug,
              locale: 'en',
              req: scoped,
              depth: 0,
            })
            expect(scoped.locale).toBe('fr')
            return true
          }
          try {
            const result = await queryBranchContent({
              branchID,
              collection: queryDocsSlug,
              req,
              locale: 'fr',
              joins: false,
              where: { 'title.fr': { equals: 'French 1' } },
            })
            expect(result.docs.map(({ id }) => id)).toEqual([1])
            expect(calls).toBe(1)
            expect(req.locale).toBe(outerLocale)
          } finally {
            config.access.read = read
          }
        },
      })
    })

    test('should merge configured join predicates and compile target relationship filters', async ({
      payload,
    }) => {
      await seeded({
        payload,
        run: async ({ req }) => {
          const result = await queryBranchContent({
            branchID,
            collection: queryDocsSlug,
            req,
            locale: 'en',
            where: { id: { equals: 2 } },
            joins: { configuredBacklinks: { where: { one: { equals: 2 } }, count: true } },
          })
          expect(result.docs[0]).toMatchObject({
            configuredBacklinks: { docs: [10], totalDocs: 1 },
          })
        },
      })
    })

    test('should compile mixed ordinary and cached join predicates with missing-field union semantics', async ({
      payload,
    }) => {
      await seeded({
        payload,
        run: async ({ req }) => {
          const result = await queryBranchContent({
            branchID,
            collection: queryDocsSlug,
            req,
            locale: 'en',
            where: { id: { equals: 2 } },
            joins: {
              mixedBacklinks: {
                where: {
                  and: [
                    { rank: { exists: false } },
                    { id: { equals: 20 } },
                    { relationTo: { equals: queryTagsSlug } },
                  ],
                },
                count: true,
              },
            },
          })
          expect(result.docs[0]).toMatchObject({
            mixedBacklinks: { docs: [{ relationTo: queryTagsSlug, value: 20 }], totalDocs: 1 },
          })
        },
      })
    })

    test('should compare cached join discriminators with the original collection slug', async ({
      payload,
    }) => {
      await seeded({
        payload,
        run: async ({ req }) => {
          const result = await queryBranchContent({
            branchID,
            collection: queryDocsSlug,
            req,
            locale: 'en',
            where: { id: { equals: 2 } },
            joins: {
              mixedBacklinks: {
                where: { and: [{ relationTo: { equals: queryDocsSlug } }, { id: { equals: 10 } }] },
                count: true,
              },
            },
          })
          expect(result.docs[0]).toMatchObject({
            mixedBacklinks: { docs: [{ relationTo: queryDocsSlug, value: 10 }], totalDocs: 1 },
          })
        },
      })
    })

    test('should use a shared target default for the whole polymorphic join', async ({
      payload,
    }) => {
      await seeded({
        payload,
        run: async ({ req }) => {
          const docs = payload.collections[queryDocsSlug]!.config
          const tags = payload.collections[queryTagsSlug]!.config
          const join = docs.polymorphicJoins.find(({ joinPath }) => joinPath === 'mixedBacklinks')!
          const original = {
            docs: docs.defaultSort,
            tags: tags.defaultSort,
            join: join.field.defaultSort,
          }
          try {
            docs.defaultSort = 'id'
            tags.defaultSort = 'id'
            join.field.defaultSort = undefined
            const result = await queryBranchContent({
              branchID,
              collection: queryDocsSlug,
              req,
              locale: 'en',
              where: { id: { equals: 2 } },
              joins: { mixedBacklinks: { count: true } },
            })
            expect(result.docs[0]).toMatchObject({
              mixedBacklinks: {
                docs: [
                  { relationTo: queryDocsSlug, value: 1 },
                  { relationTo: queryDocsSlug, value: 10 },
                  { relationTo: queryTagsSlug, value: 20 },
                ],
              },
            })
          } finally {
            docs.defaultSort = original.docs
            tags.defaultSort = original.tags
            join.field.defaultSort = original.join
          }
        },
      })
    })

    test('should preserve every shared target default sort term before union paging', async ({
      payload,
    }) => {
      await seeded({
        payload,
        hasEqualRank: true,
        run: async ({ req }) => {
          const docs = payload.collections[queryDocsSlug]!.config
          const tags = payload.collections[queryTagsSlug]!.config
          const join = docs.polymorphicJoins.find(({ joinPath }) => joinPath === 'mixedBacklinks')!
          const original = {
            docs: docs.defaultSort,
            tags: tags.defaultSort,
            join: join.field.defaultSort,
          }
          try {
            join.field.defaultSort = undefined
            for (const secondary of ['id', '-id']) {
              docs.defaultSort = tags.defaultSort = ['rank', secondary]
              const expected = secondary === 'id' ? [1, 2, 10] : [10, 2, 1]
              for (let page = 1; page <= expected.length; page++) {
                const result = await queryBranchContent({
                  branchID,
                  collection: queryDocsSlug,
                  req,
                  locale: 'en',
                  sort: 'id',
                  where: { id: { equals: 2 } },
                  joins: {
                    mixedBacklinks: {
                      where: { relationTo: { equals: queryDocsSlug } },
                      limit: 1,
                      page,
                      count: true,
                    },
                  },
                })
                expect(result.docs[0]).toMatchObject({
                  mixedBacklinks: {
                    docs: [{ relationTo: queryDocsSlug, value: expected[page - 1] }],
                    totalDocs: 3,
                  },
                })
              }
            }
            docs.defaultSort = tags.defaultSort = ['rank', '-related.title.fr']
            const related = await queryBranchContent({
              branchID,
              collection: queryDocsSlug,
              req,
              locale: 'en',
              sort: 'id',
              where: { id: { equals: 2 } },
              joins: {
                mixedBacklinks: { where: { relationTo: { equals: queryDocsSlug } }, limit: 0 },
              },
            })
            expect(related.docs[0]).toMatchObject({
              mixedBacklinks: {
                docs: (payload.db.name === 'postgres' ? [10, 1, 2] : [1, 2, 10]).map((value) => ({
                  relationTo: queryDocsSlug,
                  value,
                })),
              },
            })
            docs.defaultSort = tags.defaultSort = ['rank', '-one.title.fr']
            const control = docs.custom.branchQueryStorage
            const dirty = await invalidateBranchProjection({
              branchID,
              control,
              logicalID: 1,
              req,
              scope: { type: 'locale', locale: 'fr' },
            })
            await settleBranchProjectionInvalidation({
              control,
              expected: dirty,
              hasStructuralConflict: true,
              req,
            })
            await expect(
              queryBranchContent({
                branchID,
                collection: queryDocsSlug,
                req,
                locale: 'en',
                sort: 'id',
                joins: { configuredBacklinks: false, backlinks: false, mixedBacklinks: {} },
              }),
            ).rejects.toMatchObject({ code: 'branch-structural-conflict' })
          } finally {
            docs.defaultSort = original.docs
            tags.defaultSort = original.tags
            join.field.defaultSort = original.join
          }
        },
      })
    })

    test('should retain every typed component of a polymorphic secondary union sort', async ({
      payload,
    }) => {
      await seeded({
        payload,
        hasEqualRank: true,
        hasMixedPoly: true,
        hasEqualPoly: false,
        hasReorderedPoly: true,
        run: async ({ req }) => {
          const docs = payload.collections[queryDocsSlug]!.config
          const tags = payload.collections[queryTagsSlug]!.config
          const join = docs.polymorphicJoins.find(({ joinPath }) => joinPath === 'mixedBacklinks')!
          const original = {
            docs: docs.defaultSort,
            tags: tags.defaultSort,
            join: join.field.defaultSort,
          }
          try {
            join.field.defaultSort = undefined
            for (const secondary of ['poly.value', '-poly.value']) {
              docs.defaultSort = tags.defaultSort = ['rank', secondary]
              const expected =
                secondary === 'poly.value'
                  ? payload.db.name === 'postgres'
                    ? [1, 2, 10]
                    : [10, 1, 2]
                  : payload.db.name === 'postgres'
                    ? [10, 1, 2]
                    : [1, 2, 10]
              for (let page = 1; page <= expected.length; page++) {
                const result = await queryBranchContent({
                  branchID,
                  collection: queryDocsSlug,
                  req,
                  locale: 'en',
                  sort: 'id',
                  where: { id: { equals: 2 } },
                  joins: {
                    mixedBacklinks: {
                      where: { relationTo: { equals: queryDocsSlug } },
                      limit: 1,
                      page,
                      count: true,
                    },
                  },
                })
                expect(result.docs[0]).toMatchObject({
                  mixedBacklinks: {
                    docs: [{ relationTo: queryDocsSlug, value: expected[page - 1] }],
                    totalDocs: 3,
                  },
                })
              }
            }
          } finally {
            docs.defaultSort = original.docs
            tags.defaultSort = original.tags
            join.field.defaultSort = original.join
          }
        },
      })
    })

    test('should page a mixed join by typed logical IDs with a collection tie', async ({
      payload,
    }) => {
      await seeded({
        payload,
        hasEqualRank: true,
        run: async ({ req }) => {
          await payload.create({
            collection: queryTagsSlug,
            depth: 0,
            req,
            data: { id: 1, title: 'Same ID', one: 2 },
          })
          const expected = [
            { relationTo: queryDocsSlug, value: 1 },
            { relationTo: queryTagsSlug, value: 1 },
            { relationTo: queryDocsSlug, value: 2 },
            { relationTo: queryDocsSlug, value: 10 },
            { relationTo: queryTagsSlug, value: 20 },
          ]
          for (let page = 1; page <= expected.length; page++) {
            const result = await queryBranchContent({
              branchID,
              collection: queryDocsSlug,
              req,
              locale: 'en',
              where: { id: { equals: 2 } },
              joins: { mixedBacklinks: { sort: 'id', limit: 1, page, count: true } },
            })
            expect(result.docs[0], `page ${page}`).toMatchObject({
              mixedBacklinks: { docs: [expected[page - 1]], totalDocs: 5 },
            })
          }
        },
      })
    })

    test('should sort polymorphic relationship values by native typed min and max with nullable roots', async ({
      payload,
    }) => {
      await seeded({
        payload,
        hasMixedPoly: true,
        run: async ({ req }) => {
          const hasPostgresNullOrder = payload.db.name === 'postgres'
          for (const [sort, ids] of [
            ['poly.value', hasPostgresNullOrder ? [2, 1, 10] : [10, 2, 1]],
            ['-poly.value', hasPostgresNullOrder ? [10, 1, 2] : [1, 2, 10]],
          ] as const) {
            const result = await queryBranchContent({
              branchID,
              collection: queryDocsSlug,
              req,
              locale: 'en',
              joins: false,
              sort,
            })
            expect(result.docs.map(({ id }) => id)).toEqual(ids)
            for (let page = 1; page <= ids.length; page++) {
              const paged = await queryBranchContent({
                branchID,
                collection: queryDocsSlug,
                req,
                locale: 'en',
                joins: false,
                sort,
                limit: 1,
                page,
              })
              expect(paged.docs.map(({ id }) => id)).toEqual([ids[page - 1]])
            }
          }
          const customID = await queryBranchContent({
            branchID,
            collection: queryDocsSlug,
            req,
            locale: 'en',
            joins: false,
            where: { 'poly.value': { equals: '507f1f77bcf86cd799439011' } },
          })
          expect(customID.docs.map(({ id }) => id)).toEqual([1])
          const empty = await queryBranchContent({
            branchID,
            collection: queryDocsSlug,
            req,
            locale: 'en',
            joins: false,
            where: { 'poly.value': { exists: false } },
          })
          expect(empty.docs.map(({ id }) => id)).toEqual([10])
        },
      })
    })

    test('should break equal polymorphic value sorts with the logical root identity', async ({
      payload,
    }) => {
      await seeded({
        payload,
        hasEqualRank: true,
        hasMixedPoly: true,
        run: async ({ req }) => {
          for (const sort of ['poly.value', '-poly.value']) {
            for (const [page, id] of [
              [1, 1],
              [2, 2],
            ] as const) {
              const result = await queryBranchContent({
                branchID,
                collection: queryDocsSlug,
                req,
                locale: 'en',
                joins: false,
                where: { id: { in: [1, 2] } },
                sort,
                limit: 1,
                page,
              })
              expect(result.docs.map(({ id }) => id)).toEqual([id])
            }
          }
        },
      })
    })

    test('should preserve heterogeneous logical ID types before paginating a join union', async ({
      payload,
    }) => {
      await seeded({
        payload,
        hasEqualRank: true,
        run: async ({ req }) => {
          for (const id of ['2', '10', '507f1f77bcf86cd799439011']) {
            await payload.create({
              collection: queryTextTagsSlug,
              depth: 0,
              req,
              data: { id, one: 2 },
            })
          }
          const filtered = await queryBranchContent({
            branchID,
            collection: queryDocsSlug,
            req,
            locale: 'en',
            where: { id: { equals: 2 } },
            joins: { typedBacklinks: { where: { id: { in: [2, '2'] } }, count: true } },
          })
          expect(filtered.docs[0]).toMatchObject({
            typedBacklinks: {
              docs: [
                { relationTo: queryDocsSlug, value: 2 },
                { relationTo: queryTextTagsSlug, value: '2' },
              ],
              totalDocs: 2,
            },
          })
          const ascending = [1, 2, 10, '10', '2', '507f1f77bcf86cd799439011']
          for (const sort of ['id', '-id']) {
            const expected = sort === 'id' ? ascending : [...ascending].reverse()
            for (let page = 1; page <= expected.length; page++) {
              const result = await queryBranchContent({
                branchID,
                collection: queryDocsSlug,
                req,
                locale: 'en',
                where: { id: { equals: 2 } },
                joins: { typedBacklinks: { sort, count: true, limit: 1, page } },
              })
              const id = expected[page - 1]
              expect(result.docs[0]).toMatchObject({
                typedBacklinks: {
                  docs: [
                    {
                      relationTo: typeof id === 'number' ? queryDocsSlug : queryTextTagsSlug,
                      value: id,
                    },
                  ],
                  totalDocs: 6,
                },
              })
            }
          }
        },
      })
    })

    test('should compile logical join filters before native paging', async ({ payload }) => {
      await seeded({
        payload,
        run: async ({ req }) => {
          const result = await queryBranchContent({
            branchID,
            collection: queryDocsSlug,
            req,
            locale: 'en',
            where: { id: { equals: 2 } },
            joins: { backlinks: { where: { id: { equals: 10 } }, count: true } },
          })
          expect(result.docs[0]).toMatchObject({ backlinks: { docs: [10], totalDocs: 1 } })
        },
      })
    })

    test('should apply stable logical join identity ties before native truncation', async ({
      payload,
    }) => {
      await seeded({
        payload,
        hasEqualRank: true,
        run: async ({ req }) => {
          for (const sort of ['rank', '-rank']) {
            for (const [limit, page, expected] of [
              [1, 1, [1]],
              [1, 2, [2]],
              [2, 1, [1, 2]],
              [2, 2, [10]],
            ] as const) {
              const result = await queryBranchContent({
                branchID,
                collection: queryDocsSlug,
                req,
                locale: 'en',
                where: { id: { equals: 2 } },
                joins: { backlinks: { sort, limit, page, count: true } },
              })
              expect(result.docs[0], `${sort} limit ${limit} page ${page}`).toMatchObject({
                backlinks: { docs: expected, totalDocs: 3 },
              })
            }
          }
        },
      })
    })

    test('should return reverse join logical IDs and decode nested typed rows before selected content escapes', async ({
      payload,
    }) => {
      await seeded({
        payload,
        run: async ({ req }) => {
          const result = await queryBranchContent({
            branchID,
            collection: queryDocsSlug,
            req,
            locale: 'en',
            where: { id: { equals: 2 } },
            joins: { backlinks: { count: true, sort: 'rank', limit: 1 } },
            select: { backlinks: true, sections: true },
          })
          expect(result.docs[0]).toMatchObject({
            id: 2,
            backlinks: { docs: [1], totalDocs: 2, hasNextPage: true },
            sections: [{ id: 'section-2', target: 10 }],
          })
          expect(result.docs[0]).not.toHaveProperty('rank')
          expect(JSON.stringify(result.docs)).not.toContain('bp2:')
          expect(JSON.stringify(result.docs)).not.toContain('_branchProjection')
        },
      })
    })
  },
)

const seeded = async ({
  hasEqualRank = false,
  hasEqualPoly = hasEqualRank,
  hasMixedPoly = false,
  hasReorderedPoly = false,
  payload,
  run,
}: {
  hasEqualPoly?: boolean
  hasEqualRank?: boolean
  hasMixedPoly?: boolean
  hasReorderedPoly?: boolean
  payload: Payload
  run: ({ req }: { req: PayloadRequest }) => Promise<void>
}): Promise<void> => {
  await payload.create({ depth: 0, collection: queryTagsSlug, data: { id: 20, title: 'Visible' } })
  await payload.create({
    depth: 0,
    collection: queryTagsSlug,
    data: { id: 30, title: 'French fallback target' },
  })
  for (const id of [1, 2, 10]) {
    await payload.create({
      depth: 0,
      collection: queryDocsSlug,
      data: { id, rank: id, title: `Initial ${id}` },
    })
  }
  await payload.update({
    depth: 0,
    collection: queryTagsSlug,
    id: 20,
    data: {
      one: 2,
      owner: 1,
      owners: [1, 2],
      polyOwners: [
        { relationTo: queryDocsSlug, value: 1 },
        { relationTo: queryTagsSlug, value: 20 },
      ],
    },
  })
  if (hasMixedPoly) {
    for (const id of ['2', '10', '507f1f77bcf86cd799439011']) {
      await payload.create({ collection: queryTextTagsSlug, depth: 0, data: { id } })
    }
  }
  for (const id of [1, 2, 10]) {
    const body = {
      rank: hasEqualRank ? 1 : id,
      fr: 'Shared',
      title: `English ${id}`,
      localeTarget: id === 2 ? null : 20,
      details: id === 2 ? {} : { heading: `Heading ${id}`, target: 20 },
      one: !hasEqualRank && id === 2 ? null : 2,
      related: id === 1 ? [2, 10] : id === 2 ? [10, 2] : [],
      poly: hasReorderedPoly
        ? id === 10
          ? []
          : id === 1
            ? [
                { relationTo: queryTextTagsSlug, value: '2' },
                { relationTo: queryDocsSlug, value: 2 },
                { relationTo: queryTextTagsSlug, value: '507f1f77bcf86cd799439011' },
              ]
            : [
                { relationTo: queryDocsSlug, value: 10 },
                { relationTo: queryTextTagsSlug, value: '10' },
              ]
        : hasMixedPoly
          ? id === 10
            ? []
            : [
                { relationTo: queryDocsSlug, value: hasEqualPoly ? 2 : id === 1 ? 10 : 2 },
                {
                  relationTo: queryTextTagsSlug,
                  value: hasEqualPoly ? '10' : id === 1 ? '2' : '10',
                },
                ...(id === 1 && !hasEqualPoly
                  ? [{ relationTo: queryTextTagsSlug, value: '507f1f77bcf86cd799439011' }]
                  : []),
              ]
          : id === 1
            ? [{ relationTo: queryDocsSlug, value: 2 }]
            : [{ relationTo: queryTagsSlug, value: 20 }],
      tag: id === 1 ? 20 : null,
      sections: [{ id: `section-${id}`, label: `Section ${id}`, target: 10 }],
      content: [{ id: `block-${id}`, blockType: 'query-note', label: `Block ${id}`, target: 2 }],
    }
    await payload.update({
      depth: 0,
      collection: queryDocsSlug,
      id,
      draft: true,
      locale: 'en',
      data: body,
    })
    await payload.update({
      depth: 0,
      collection: queryDocsSlug,
      id,
      draft: true,
      locale: 'fr',
      data: {
        title: `French ${id}`,
        localeTarget: 30,
        details: { heading: `French heading ${id}`, target: 30 },
      },
    })
  }
  const req = await createPayloadRequest({ context: {}, payload })
  const transactionID = await payload.db.beginTransaction()
  if (!transactionID) {
    throw new Error('Native branch query fixture requires a transaction.')
  }
  req.transactionID = transactionID
  try {
    for (const id of [1, 2, 10]) {
      const revision = await payload.db.findVersions({
        collection: queryDocsSlug,
        req,
        locale: 'all',
        limit: 1,
        where: { and: [{ parent: { equals: id } }, { latest: { equals: true } }] },
      })
      const target = { collection: heads, parentID: id }
      const reference = await initializeBranchVersion({
        branchID: 'main',
        isFrozen: false,
        req,
        target,
        versionID: revision.docs[0]!.id,
      })
      for (const scope of [
        { type: 'shared' as const },
        { type: 'locale' as const, locale: 'en' },
        { type: 'locale' as const, locale: 'fr' },
      ]) {
        const expected = await readBranchHeadToken({ branchID: 'main', req, scope, target })
        await writeBranchHead({
          expected,
          nextState: {
            type: 'version',
            version: reference,
            structure: scope.type === 'locale' ? reference : null,
          },
          req,
          target,
        })
      }
    }
    await bootstrapBranchProjectionPage({ branchID, collection: heads, req })
    await run({ req })
  } finally {
    await payload.db.rollbackTransaction(transactionID)
  }
}
