/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Tests use the shared fixture wrapper. */
import type { Payload, SelectType } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Retention is an internal lifecycle helper.
import { enforceMaxVersions } from '../../packages/payload/src/versions/enforceMaxVersions.js'
import { test } from '../__helpers/int/vitest.js'
import { queries } from './config.js'
import { data, timestamp } from './fixtures.js'
import { collectionSlug, globalSlug } from './shared.js'

const expectedProfile = {
  content: [{ blockType: 'card', title: 'Block value' }],
  label: data.profile.label,
  nested: data.profile.nested,
  note: data.profile.note,
  rows: [{ value: 'Array value' }],
}
const expectedPanel = { rows: [{ value: 'Tab array value' }] }

const getParent = async ({ payload, title = 'Fixture' }: { payload: Payload; title?: string }) => {
  const parent = await payload.db.findOne({
    collection: collectionSlug,
    select: { id: true },
    where: { title: { equals: title } },
  })

  if (!parent) {
    throw new Error(`Missing fixture: ${title}`)
  }

  return parent.id
}

const versionQuery = ({
  kind,
  parent,
  payload,
  select,
}: {
  kind: 'collection' | 'global'
  parent: number | string
  payload: Payload
  select?: SelectType
}) =>
  kind === 'collection'
    ? payload.db.findVersions({
        collection: collectionSlug,
        limit: 1,
        pagination: false,
        select,
        sort: '-updatedAt',
        where: { parent: { equals: parent } },
      })
    : payload.db.findGlobalVersions({
        global: globalSlug,
        limit: 1,
        pagination: false,
        select,
        sort: '-updatedAt',
      })

// The raw adapter retains undefined properties and empty group shells for omitted fields.
const populated = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(populated)
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([key, child]) => [key, populated(child)] as const)
      .filter(([, child]) => child !== undefined)

    return entries.length ? Object.fromEntries(entries) : undefined
  }
  return value
}

test.suite(
  'Version retention projections',
  { config: './config.ts', db: (adapter) => adapter.startsWith('postgres') },
  () => {
    test.afterEach(() => {
      queries.length = 0
    })
    test('should keep ordinary document inclusion and exclusion projections correct', async ({
      payload,
    }) => {
      const parent = await getParent({ payload })

      const onlyTitle = await payload.db.findOne({
        collection: collectionSlug,
        select: { title: true },
        where: { id: { equals: parent } },
      })
      expect(populated(onlyTitle)).toEqual({ id: parent, title: 'Fixture' })
      const profile = await payload.db.findOne({
        collection: collectionSlug,
        locale: 'en',
        select: { profile: true },
        where: { id: { equals: parent } },
      })
      expect(populated(profile)).toMatchObject({ id: parent, profile: expectedProfile })
      expect(Object.keys(populated(profile) as object).sort()).toEqual(['id', 'profile'])
      const exclusion = await payload.db.findOne({
        collection: collectionSlug,
        locale: 'de',
        select: { secret: false },
        where: { id: { equals: parent } },
      })
      expect(populated(exclusion)).not.toHaveProperty('secret')
      expect(exclusion).toMatchObject({
        panel: expectedPanel,
        profile: expectedProfile,
        title: 'Fixture',
      })
    })

    test.describe.each(['collection', 'global'] as const)(
      '%s PostgreSQL version projections',
      (kind) => {
        test('should load only the cutoff date without nested groups, arrays or blocks in SQL', async ({
          payload,
        }) => {
          const parent = await getParent({ payload })

          queries.length = 0
          const result = await versionQuery({ kind, parent, payload, select: { updatedAt: true } })
          expect(populated(result.docs[0])).toEqual({
            id: expect.anything(),
            updatedAt: timestamp({ index: 3 }),
          })
          expect(queries.length).toBeGreaterThan(0)
          expect(queries.join('\n')).not.toMatch(/profile|panel|json_agg|json_build_array/i)
        })

        test('should select one localized nested field without loading its sibling arrays or blocks', async ({
          payload,
        }) => {
          const parent = await getParent({ payload })

          queries.length = 0
          const result = await versionQuery({
            kind,
            parent,
            payload,
            select: { version: { profile: { label: true } } },
          })
          expect(populated(result.docs[0]!.version)).toEqual({
            profile: { label: data.profile.label },
          })
          expect(queries.join('\n')).not.toMatch(
            /profile_rows|profile_content|blocks_card|panel_rows|profile_note/,
          )
        })

        test('should select a whole group, retaining its nested arrays, blocks and groups', async ({
          payload,
        }) => {
          const parent = await getParent({ payload })

          const result = await versionQuery({
            kind,
            parent,
            payload,
            select: { version: { profile: true } },
          })
          expect(populated(result.docs[0]!.version)).toMatchObject({ profile: expectedProfile })
          expect(Object.keys(populated(result.docs[0]!.version) as object)).toEqual(['profile'])
        })

        test('should select an entire named tab without loading an omitted group', async ({
          payload,
        }) => {
          const parent = await getParent({ payload })

          queries.length = 0
          const result = await versionQuery({
            kind,
            parent,
            payload,
            select: { version: { panel: true } },
          })
          expect(populated(result.docs[0]!.version)).toMatchObject({ panel: expectedPanel })
          expect(Object.keys(populated(result.docs[0]!.version) as object)).toEqual(['panel'])
          expect(queries.join('\n')).not.toMatch(/profile|blocks_card/)
        })

        test('should exclude an entire group while preserving named tabs and other fields', async ({
          payload,
        }) => {
          const parent = await getParent({ payload })

          queries.length = 0
          const result = await versionQuery({
            kind,
            parent,
            payload,
            select: { version: { profile: false } },
          })
          expect(populated(result.docs[0]!.version)).not.toHaveProperty('profile')
          expect(populated(result.docs[0]!.version)).toMatchObject({
            panel: expectedPanel,
            secret: data.secret,
            title: 'Version 3',
          })
          expect(queries.join('\n')).not.toMatch(/profile|blocks_card/)
        })

        test('should select a whole version, including named tabs and nested groups', async ({
          payload,
        }) => {
          const parent = await getParent({ payload })

          const result = await versionQuery({ kind, parent, payload, select: { version: true } })
          expect(result.docs[0]!.version).toMatchObject({
            _status: data._status,
            panel: expectedPanel,
            profile: expectedProfile,
            secret: data.secret,
            title: 'Version 3',
          })
        })

        test('should preserve exclusion projections and unselected named tabs', async ({
          payload,
        }) => {
          const parent = await getParent({ payload })

          const result = await versionQuery({
            kind,
            parent,
            payload,
            select: {
              version: { profile: { note: false }, secret: false },
            },
          })
          const version = populated(result.docs[0]!.version) as Record<string, unknown>
          expect(version).not.toHaveProperty('secret')
          expect(version.profile).not.toHaveProperty('note')
          expect(version).toMatchObject({
            panel: expectedPanel,
            profile: {
              content: expectedProfile.content,
              nested: data.profile.nested,
              rows: expectedProfile.rows,
            },
            title: 'Version 3',
          })
        })

        test('should preserve the complete document when select is absent', async ({ payload }) => {
          const parent = await getParent({ payload })

          const result = await versionQuery({ kind, parent, payload })
          expect(result.docs[0]!.version).toMatchObject({
            _status: data._status,
            panel: expectedPanel,
            profile: expectedProfile,
            secret: data.secret,
            title: 'Version 3',
          })
        })

        test('should apply native retention in the transaction and preserve its exact deletion scope', async ({
          payload,
        }) => {
          const parent = await getParent({ payload })
          const otherParent = await getParent({ payload, title: 'Unrelated document' })
          const transactionID = await payload.db.beginTransaction()
          expect(transactionID).toBeTruthy()
          try {
            const req = await createPayloadRequest({ payload })
            req.transactionID = transactionID!
            queries.length = 0
            await enforceMaxVersions({
              id: parent,
              ...(kind === 'collection'
                ? { collection: payload.collections[collectionSlug].config }
                : { global: payload.globals.config.find((entry) => entry.slug === globalSlug) }),
              max: 2,
              payload,
              req,
            })
            const result =
              kind === 'collection'
                ? await payload.db.findVersions({
                    collection: collectionSlug,
                    limit: 100,
                    pagination: false,
                    req,
                    select: { updatedAt: true },
                    sort: 'updatedAt',
                    where: { parent: { equals: parent } },
                  })
                : await payload.db.findGlobalVersions({
                    global: globalSlug,
                    limit: 100,
                    pagination: false,
                    req,
                    select: { updatedAt: true },
                    sort: 'updatedAt',
                  })
            expect(result.docs.map((version) => version.updatedAt)).toEqual(
              Array.from({ length: 2 }, (_, index) => timestamp({ index: index + 2 })),
            )
            // deleteVersions subsequently loads deleted rows for relationship cleanup.
            // Only the initial cutoff SELECT needs the timestamp projection.
            expect(queries[0]).toMatch(/updated_at.*limit.*offset/)
            expect(queries[0]).not.toMatch(/profile|panel|json_agg|json_build_array/i)
            // The cleanup must not commit outside the surrounding editor transaction.
            const outside =
              kind === 'collection'
                ? await payload.db.countVersions({
                    collection: collectionSlug,
                    where: { parent: { equals: parent } },
                  })
                : await payload.db.countGlobalVersions({ global: globalSlug })
            expect(outside.totalDocs).toBe(4)
            const unrelated = await payload.db.countVersions({
              collection: collectionSlug,
              req,
              where: { parent: { equals: otherParent } },
            })
            expect(unrelated.totalDocs).toBe(1)
          } finally {
            await payload.db.rollbackTransaction(transactionID!)
          }
          const rolledBack =
            kind === 'collection'
              ? await payload.db.countVersions({
                  collection: collectionSlug,
                  where: { parent: { equals: parent } },
                })
              : await payload.db.countGlobalVersions({ global: globalSlug })
          expect(rolledBack.totalDocs).toBe(4)
        })
        test('should save and restore through the Local API without losing nested or localized content', async ({
          payload,
        }) => {
          const parent = await getParent({ payload })
          const otherParent = await getParent({ payload, title: 'Unrelated document' })

          const previous = (await versionQuery({ kind, parent, payload })).docs[0]
          if (kind === 'collection') {
            await payload.update({
              id: parent,
              collection: collectionSlug,
              data: { title: 'Editor save' },
            })
            expect(
              (
                await payload.db.countVersions({
                  collection: collectionSlug,
                  where: { parent: { equals: parent } },
                })
              ).totalDocs,
            ).toBe(2)
            await payload.restoreVersion({
              id: String(previous!.id),
              collection: collectionSlug,
              locale: 'de',
            })
          } else {
            await payload.updateGlobal({ slug: globalSlug, data: { title: 'Editor save' } })
            expect((await payload.db.countGlobalVersions({ global: globalSlug })).totalDocs).toBe(2)
            await payload.restoreGlobalVersion({
              id: String(previous!.id),
              slug: globalSlug,
              locale: 'de',
            })
          }
          for (const locale of ['de', 'en'] as const) {
            const restored =
              kind === 'collection'
                ? await payload.findByID({ id: parent, collection: collectionSlug, locale })
                : await payload.findGlobal({ slug: globalSlug, locale })
            expect(restored).toMatchObject({
              _status: 'published',
              panel: data.panel,
              profile: { ...data.profile, label: data.profile.label[locale] },
              secret: data.secret,
              title: 'Version 3',
            })
          }
          const count =
            kind === 'collection'
              ? await payload.db.countVersions({
                  collection: collectionSlug,
                  where: { parent: { equals: parent } },
                })
              : await payload.db.countGlobalVersions({ global: globalSlug })
          // Upstream global restore bypasses saveVersion/enforceMaxVersions and adds
          // one version. The following normal save must enforce the limit again.
          expect(count.totalDocs).toBe(kind === 'collection' ? 2 : 3)
          if (kind === 'global') {
            await payload.updateGlobal({ slug: globalSlug, data: { title: 'Version 3' } })
            expect((await payload.db.countGlobalVersions({ global: globalSlug })).totalDocs).toBe(2)
          }
          const unrelated = await payload.db.countVersions({
            collection: collectionSlug,
            where: { parent: { equals: otherParent } },
          })
          expect(unrelated.totalDocs).toBe(1)
        })
      },
    )
  },
)
