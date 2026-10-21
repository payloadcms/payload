/* eslint-disable payload/no-relative-monorepo-imports -- Exercise the real D1 compiler without initializing Payload. */
import type { AnyD1Database } from 'drizzle-orm/d1'
import type { CollectionConfig, FlattenedField, PayloadRequest, Where } from 'payload'

import { drizzle } from 'drizzle-orm/d1'
import { createRequire } from 'node:module'
import { BasePayload, buildConfig, buildVersionCollectionFields } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { SQLiteD1Adapter } from '../../packages/db-d1-sqlite/src/types.js'
import type { DrizzleAdapter } from '../../packages/drizzle/src/types.js'
import type {
  BranchContentScope,
  BranchHeadState,
  BranchVersionReference,
} from '../../packages/payload/src/versions/branches/types.js'

import { sqliteD1Adapter } from '../../packages/db-d1-sqlite/src/index.js'
import { transformForWrite } from '../../packages/drizzle/src/transform/write/index.js'
import { insertArrays } from '../../packages/drizzle/src/upsertRow/insertArrays.js'
import { compileBranchScopeFields } from '../../packages/payload/src/versions/branches/compileBranchScopeFields.js'
import { encodeBranchProjectionDocument } from '../../packages/payload/src/versions/branches/queries/branchProjectionCodec.js'
import { composeBranchProjection } from '../../packages/payload/src/versions/branches/queries/composeBranchProjection.js'
import {
  countBranchContent,
  findDistinctBranchContent,
} from '../../packages/payload/src/versions/branches/queries/queryBranchAggregates.js'
import { queryBranchContent } from '../../packages/payload/src/versions/branches/queries/queryBranchContent.js'
import { queryBranchContentGraph } from '../../packages/payload/src/versions/branches/queries/queryBranchContentGraph.js'
import { registerBranchQueryStorage } from '../../packages/payload/src/versions/branches/queries/registerBranchQueryStorage.js'
import { readBranchHeads } from '../../packages/payload/src/versions/branches/storage/branchHeadStore.js'
import {
  isBranchIdentityVisible,
  readBranchIdentityVisibility,
} from '../../packages/payload/src/versions/branches/storage/branchIdentityStore.js'
import {
  getBranchKey,
  getBranchStorageKey,
} from '../../packages/payload/src/versions/branches/storage/branchStorage.js'
import { registerBranchStorage } from '../../packages/payload/src/versions/branches/storage/registerBranchStorage.js'

const require = createRequire(import.meta.url)
const isNativeEnabled = process.env.BRANCH_READ_SNAPSHOT_NATIVE === 'true'
const docsSlug = 'd1-branch-docs'
const tagsSlug = 'd1-ordinary-tags'
const branchID = 'staging'
const snapshotTime = '2026-10-21T00:00:00.000Z'

describe.skipIf(!isNativeEnabled)('native D1 head-derived effective queries', () => {
  let miniflare: { dispose: () => Promise<void> }
  let binding: AnyD1Database
  let adapter: SQLiteD1Adapter
  let payload: BasePayload
  let stateTable: string
  let tagTable: string
  const request = ({ context = {} }: { context?: Record<string, unknown> } = {}) =>
    Object.assign(new Request('https://payload.test/api/d1-branch-docs'), {
      context,
      locale: 'en',
      payload,
    }) as unknown as PayloadRequest

  beforeAll(async () => {
    const { Miniflare } = await import(
      require.resolve('miniflare', { paths: [require.resolve('wrangler/package.json')] })
    )
    const worker = new Miniflare({
      compatibilityDate: '2025-08-15',
      compatibilityFlags: ['nodejs_compat'],
      d1Databases: ['DB'],
      modules: true,
      script: 'export default { fetch() { return new Response("ok") } }',
    })

    miniflare = worker
    binding = await worker.getD1Database('DB')
    payload = new BasePayload()
    const collections: CollectionConfig[] = [
      {
        slug: docsSlug,
        access: { read: ({ req }) => (req.context.docAccess as false | Where) ?? true },
        fields: [
          { name: 'id', type: 'number' },
          { name: 'rank', type: 'number', index: true },
          { name: 'title', type: 'text', localized: true },
          { name: 'friend', type: 'relationship', relationTo: docsSlug },
          { name: 'tag', type: 'relationship', relationTo: tagsSlug },
          { name: 'incoming', type: 'join', collection: docsSlug, on: 'friend' },
          { name: 'tagOwners', type: 'join', collection: tagsSlug, on: 'owner' },
          {
            name: 'sections',
            type: 'array',
            fields: [
              { name: 'caption', type: 'text', localized: true },
              { name: 'target', type: 'relationship', relationTo: docsSlug },
            ],
          },
        ],
        versions: { drafts: true },
      },
      {
        slug: tagsSlug,
        access: { read: ({ req }) => (req.context.tagAccess as false | Where) ?? true },
        fields: [
          { name: 'id', type: 'number' },
          { name: 'title', type: 'text' },
          { name: 'owner', type: 'relationship', relationTo: docsSlug },
        ],
        timestamps: false,
        versions: false,
      },
    ]
    const registered = registerBranchQueryStorage(
      registerBranchStorage({ collections, globals: [], versionIDType: 'number' }),
    )
    const database = sqliteD1Adapter({ binding, push: false })

    payload.config = await buildConfig({
      ...registered,
      db: database,
      localization: { defaultLocale: 'en', locales: ['en', 'fr'] },
      secret: 'native-d1-effective-query-test',
      typescript: { autoGenerate: false },
    })
    payload.collections = Object.fromEntries(
      payload.config.collections.map((config) => [config.slug, { config }]),
    ) as never
    adapter = database.init({ payload })
    payload.db = adapter as never
    await adapter.init!()
    adapter.drizzle = drizzle(binding, { schema: adapter.schema }) as never
    adapter.client = binding as never
    const { generateDrizzleJson, generateMigration } = adapter.requireDrizzleKit()
    const schema = await generateDrizzleJson(adapter.schema)
    const statements = await generateMigration(adapter.defaultDrizzleSnapshot as never, schema)
    const seed = [
      binding.prepare('PRAGMA defer_foreign_keys = ON'),
      ...statements.map((sql: string) => binding.prepare(sql)),
    ]
    const pendingArrays: Promise<void>[] = []
    const nextArrayID = new Map<string, number>()
    const collectingAdapter = Object.assign(Object.create(adapter), {
      insert: ({
        tableName,
        values,
      }: {
        tableName: string
        values: Record<string, unknown> | Record<string, unknown>[]
      }) => {
        const rows = (Array.isArray(values) ? values : [values]).map((value) => {
          if (value.id != null || adapter.tables[tableName].id.dataType !== 'number') {
            return value
          }
          const id = (nextArrayID.get(tableName) ?? 0) + 1

          nextArrayID.set(tableName, id)
          return { ...value, id }
        })
        const query = adapter.drizzle.insert(adapter.tables[tableName]).values(rows).toSQL()

        seed.push(binding.prepare(query.sql).bind(...query.params))
        return Promise.resolve(rows)
      },
    }) as DrizzleAdapter
    const queueRow = ({
      data,
      fields,
      id,
      tableName,
    }: {
      data: Record<string, unknown>
      fields: FlattenedField[]
      id: number | string
      tableName: string
    }) => {
      const transformed = transformForWrite({
        adapter: adapter as unknown as DrizzleAdapter,
        data: structuredClone(data),
        fields,
        tableName,
      })

      expect(transformed.relationships).toEqual([])
      expect(transformed.blocks).toEqual({})
      const row = adapter.drizzle
        .insert(adapter.tables[tableName])
        .values({ ...transformed.row, id })
        .toSQL()

      seed.push(binding.prepare(row.sql).bind(...row.params))
      pendingArrays.push(
        insertArrays({
          adapter: collectingAdapter,
          arrays: [transformed.arrays],
          db: adapter.drizzle as never,
          parentRows: [{ id }],
        }),
      )
      for (const [locale, values] of Object.entries(transformed.locales)) {
        const localized = adapter.drizzle
          .insert(adapter.tables[`${tableName}${adapter.localesSuffix}`])
          .values({ ...values, _locale: locale, _parentID: id })
          .toSQL()

        seed.push(binding.prepare(localized.sql).bind(...localized.params))
      }
    }
    const queueCollection = ({
      slug,
      id,
      data,
    }: {
      data: Record<string, unknown>
      id: number | string
      slug: string
    }) => {
      const config = payload.collections[slug]!.config
      const tableName = adapter.tableNameMap.get(slug.replaceAll('-', '_'))!

      queueRow({ data, fields: config.flattenedFields, id, tableName })
    }
    const source = payload.collections[docsSlug]!.config
    const storage = source.custom.branchStorage
    const queryStorage = source.custom.branchQueryStorage
    const versionFields = buildVersionCollectionFields(payload.config, source, true)
    const versionTable = adapter.tableNameMap.get(
      `_${docsSlug.replaceAll('-', '_')}${adapter.versionsSuffix}`,
    )!
    const projectionSlugs = { [docsSlug]: queryStorage.projection }
    let versionID = 0
    let headID = 0
    let pinID = 0

    for (const id of [1, 2, 10, 20]) {
      queueCollection({
        slug: docsSlug,
        id,
        data: { rank: -id, title: { en: `ordinary ${id}`, fr: `ordinaire ${id}` } },
      })
    }
    // Ordinary targets form a cycle back into the branchable entity. Their owner is a
    // native numeric identity, whereas the corresponding cached relationship is hashed.
    for (const id of [100, 200]) {
      queueCollection({
        slug: tagsSlug,
        id,
        data: { title: id === 100 ? 'visible' : 'denied', owner: id === 100 ? 1 : 20 },
      })
    }
    for (const id of [1, 2, 10, 20]) {
      const snapshots = [
        {
          id: ++versionID,
          data: {
            createdAt: snapshotTime,
            updatedAt: snapshotTime,
            rank: id,
            sections: [
              {
                id: `section:${id}`,
                caption: { en: `live row ${id}`, fr: `public row ${id}` },
                target: id === 1 ? 2 : 1,
              },
            ],
            title: { en: `live ${id}`, fr: `public ${id}` },
            friend: id === 1 ? 2 : 1,
            tag: id === 20 ? 200 : 100,
          },
        },
        {
          id: ++versionID,
          data: {
            createdAt: snapshotTime,
            updatedAt: snapshotTime,
            rank: id + 100,
            sections: [
              {
                id: `section:${id}`,
                caption: { en: `working row ${id}`, fr: `brouillon row ${id}` },
                target: id === 1 ? 2 : 1,
              },
            ],
            title: { en: `working ${id}`, fr: `brouillon ${id}` },
            friend: id === 1 ? 2 : 1,
            tag: id === 20 ? 200 : 100,
          },
        },
      ]
      const reference = ({ id }: { id: number }): BranchVersionReference => ({ generation: 1, id })
      const live: BranchHeadState = {
        type: 'version',
        version: reference(snapshots[0]!),
        structure: null,
      }
      const working: BranchHeadState = {
        type: 'version',
        version: reference(snapshots[1]!),
        structure: null,
      }
      const scopes = [
        { scope: { type: 'shared' as const }, main: live, selected: id === 2 ? working : live },
        { scope: { type: 'locale' as const, locale: 'en' }, main: live, selected: live },
        { scope: { type: 'locale' as const, locale: 'fr' }, main: live, selected: working },
      ]

      for (const snapshot of snapshots) {
        queueRow({
          id: snapshot.id,
          tableName: versionTable,
          fields: versionFields,
          data: {
            parent: id,
            version: snapshot.data,
            branchOnly: true,
            branchFrozen: true,
            branchGeneration: 1,
            branchOwnerKey: getBranchKey({ branchID }),
            latest: false,
          },
        })
      }
      for (const { scope, main, selected } of scopes) {
        const scopeKey = scope.type === 'shared' ? 'shared' : `locale:${scope.locale}`

        for (const [selectedBranch, state] of [
          ['main', main],
          [branchID, selected],
        ] as const) {
          const rootKey = `head:${getBranchKey({ branchID: selectedBranch })}:${scopeKey}:0:1`

          queueCollection({
            slug: storage.pins,
            id: ++pinID,
            data: {
              parent: id,
              versionID: state.version.id,
              versionGeneration: 1,
              rootKey,
              referenceKey: getBranchStorageKey({ coordinates: [state.version.id, rootKey] }),
            },
          })
          queueCollection({
            slug: storage.heads,
            id: ++headID,
            data: {
              parent: id,
              coordinateKey: getBranchStorageKey({
                coordinates: [id, getBranchKey({ branchID: selectedBranch }), scopeKey],
              }),
              branchKey: getBranchKey({ branchID: selectedBranch }),
              scopeKey,
              generation: 1,
              incarnation: 0,
              state: 'version',
              versionID: state.version.id,
              versionGeneration: state.version.generation,
            },
          })
        }
      }
      queueCollection({
        slug: storage.identities,
        id,
        data: {
          parent: id,
          singleton: 'collection',
          generation: 1,
          ownerKey: getBranchKey({ branchID: id === 10 ? 'other' : branchID }),
          isPublished: id !== 10,
          isLegacyDraftVisible: true,
        },
      })
      const composed = composeBranchProjection({
        fields: compileBranchScopeFields({ fields: source.fields }),
        isStatusLocalized: true,
        logicalID: id,
        scopes,
        versions: snapshots.map((snapshot) => ({
          data: snapshot.data,
          reference: reference(snapshot),
        })),
      })

      if (composed.conflictedLocales.length) {
        throw new Error('Fixture contains conflicting locale structures.')
      }
      const projection = encodeBranchProjectionDocument({
        branchID,
        data: composed.data,
        fields: source.fields,
        projectionSlugs,
        isVisible: id !== 10,
      })

      queueCollection({
        slug: queryStorage.projection,
        id: projection.id as string,
        data: projection,
      })
    }
    for (const [index, scopeKey] of ['shared', 'locale:en', 'locale:fr'].entries()) {
      queueCollection({
        slug: queryStorage.states,
        id: index + 1,
        data: {
          branchKey: getBranchKey({ branchID }),
          scopeKey,
          generation: 1,
          pendingCount: 0,
          isInitialized: true,
          rowKey: getBranchStorageKey({ coordinates: [getBranchKey({ branchID }), scopeKey] }),
        },
      })
    }
    stateTable = adapter.tableNameMap.get(queryStorage.states.replaceAll('-', '_'))!
    tagTable = adapter.tableNameMap.get(tagsSlug.replaceAll('-', '_'))!
    // This is fixture installation, not the unfinished domain write compiler: schema,
    // frozen source revisions, heads, durable roots and their composed cache commit together.
    await Promise.all(pendingArrays)
    await binding.batch(seed)
  }, 60_000)

  afterAll(async () => {
    await miniflare?.dispose()
  })

  it('should derive every cached row from the exact persisted frozen head revisions and identity visibility', async () => {
    const req = request()
    const source = payload.collections[docsSlug]!.config
    const storage = source.custom.branchStorage
    const queryStorage = source.custom.branchQueryStorage
    const scopes: BranchContentScope[] = [
      { type: 'shared' },
      { type: 'locale', locale: 'en' },
      { type: 'locale', locale: 'fr' },
    ]

    for (const id of [1, 2, 10, 20]) {
      const target = { collection: storage.heads, parentID: id }
      const heads = await readBranchHeads({
        req,
        target,
        selections: scopes.flatMap((scope) => [
          { branchID: 'main', scope },
          { branchID, scope },
        ]),
      })
      const versions = await adapter.findVersions({
        collection: docsSlug,
        req,
        locale: 'all',
        limit: 10,
        where: { parent: { equals: id } },
      })

      expect(versions.docs).toHaveLength(2)
      expect(
        versions.docs.every(
          (version) => version.branchFrozen === true && version.branchGeneration === 1,
        ),
      ).toBe(true)
      const composed = composeBranchProjection({
        fields: compileBranchScopeFields({ fields: source.fields }),
        isStatusLocalized: true,
        logicalID: id,
        scopes: scopes.map((scope, index) => ({
          scope,
          main: heads[index * 2]!.state,
          selected: heads[index * 2 + 1]!.state,
        })),
        versions: versions.docs.map((version) => ({
          data: version.version,
          reference: { id: version.id, generation: version.branchGeneration as number },
        })),
      })
      const visibility = await readBranchIdentityVisibility({ req, target })
      const expected = encodeBranchProjectionDocument({
        branchID,
        data: composed.data,
        fields: source.fields,
        projectionSlugs: { [docsSlug]: queryStorage.projection },
        isVisible: isBranchIdentityVisible({ branchID, visibility: visibility! }),
      })
      const cached = await adapter.findOne({
        collection: queryStorage.projection,
        req,
        locale: 'all',
        where: { id: { equals: expected.id } },
      })

      expect(cached).toMatchObject(expected)
      for (const head of heads) {
        expect(head.state?.type).toBe('version')
        const scopeKey = head.scope.type === 'shared' ? 'shared' : `locale:${head.scope.locale}`
        const rootKey = `head:${getBranchKey({ branchID: head.branchID })}:${scopeKey}:0:1`
        const pin = await adapter.findOne({
          collection: storage.pins,
          req,
          where: {
            referenceKey: {
              equals: getBranchStorageKey({
                coordinates: [
                  (head.state as Extract<BranchHeadState, { type: 'version' }>).version.id,
                  rootKey,
                ],
              }),
            },
          },
        })

        expect(pin).toMatchObject({ parent: id, versionGeneration: 1, rootKey })
      }
    }
  })

  it('should evaluate typed logical IDs, sorting, native paging, count and distinct on the composed relation', async () => {
    const req = request()
    const args = {
      branchID,
      collection: docsSlug,
      locale: 'en' as const,
      req,
      joins: false as const,
    }
    const result = await queryBranchContent({ ...args, sort: 'id', limit: 1, page: 2 })

    expect(result.docs.map(({ id }) => id)).toEqual([2])
    expect(result.totalDocs).toBe(3)
    expect(result.docs[0]).toMatchObject({ rank: 102, title: { en: 'live 2', fr: 'brouillon 2' } })
    expect(result.docs[0]).not.toHaveProperty('_branchProjection')
    expect(
      (await queryBranchContent({ ...args, where: { id: { in: [1, 10] } } })).docs.map(
        ({ id }) => id,
      ),
    ).toEqual([1])
    expect(await countBranchContent({ ...args, where: { rank: { greater_than: 20 } } })).toEqual({
      totalDocs: 1,
    })
    expect((await findDistinctBranchContent({ ...args, field: 'id', sort: 'id' })).values).toEqual([
      { id: 1 },
      { id: 2 },
      { id: 20 },
    ])
  })

  it('should combine a selected shared revision with independently owned locale revisions', async () => {
    const req = request()
    const args = {
      branchID,
      collection: docsSlug,
      joins: false as const,
      req,
      where: { id: { equals: 2 } },
    }
    const english = await queryBranchContent({ ...args, locale: 'en' })
    const french = await queryBranchContent({ ...args, locale: 'fr' })

    expect(french.docs[0]!.sections).toEqual([
      { id: 'section:2', caption: { en: 'live row 2', fr: 'brouillon row 2' }, target: 1 },
    ])
    expect(
      (
        await queryBranchContent({
          ...args,
          locale: 'fr',
          where: { 'sections.caption': { equals: 'brouillon row 2' } },
        })
      ).docs.map(({ id }) => id),
    ).toEqual([2])

    expect(english.docs[0]).toMatchObject({
      id: 2,
      rank: 102,
      title: { en: 'live 2', fr: 'brouillon 2' },
    })
    expect(french.docs[0]).toMatchObject({
      id: 2,
      rank: 102,
      title: { en: 'live 2', fr: 'brouillon 2' },
    })
    expect(
      (
        await queryBranchContent({
          ...args,
          locale: 'en',
          where: { 'title.fr': { equals: 'brouillon 2' } },
        })
      ).docs.map(({ id }) => id),
    ).toEqual([2])
  })

  it('should apply original access and visibility before native membership, count and relationship traversal', async () => {
    const req = request({
      context: {
        docAccess: { id: { not_equals: 20 } },
        tagAccess: { title: { equals: 'visible' } },
      },
    })
    const args = {
      branchID,
      collection: docsSlug,
      locale: 'en' as const,
      req,
      joins: false as const,
    }

    expect(
      (
        await queryBranchContent({
          ...args,
          where: { 'tag.title': { equals: 'visible' } },
          sort: 'id',
        })
      ).docs.map(({ id }) => id),
    ).toEqual([1, 2])
    expect(
      (await queryBranchContent({ ...args, where: { 'friend.rank': { equals: 102 } } })).docs.map(
        ({ id }) => id,
      ),
    ).toEqual([1])
    expect(
      (
        await queryBranchContent({ ...args, where: { 'sections.target.rank': { equals: 102 } } })
      ).docs.map(({ id }) => id),
    ).toEqual([1])
    expect(await countBranchContent({ ...args })).toEqual({ totalDocs: 2 })
    req.context.tagAccess = { 'owner.rank': { equals: 1 } }
    expect(
      (
        await queryBranchContent({ ...args, where: { 'tag.title': { equals: 'visible' } } })
      ).docs.map(({ id }) => id),
    ).toEqual([1, 2])
    req.context.tagAccess = false
    expect(
      (await queryBranchContent({ ...args, where: { 'tag.title': { equals: 'visible' } } }))
        .totalDocs,
    ).toBe(0)
  })

  it('should freeze a bounded graph containing branch and ordinary targets, denied misses and cycles', async () => {
    const req = request({ context: { tagAccess: { title: { not_equals: 'denied' } } } })
    const { graph, result } = await queryBranchContentGraph({
      branchID,
      collection: docsSlug,
      req,
      depth: 2,
      locale: 'fr',
      where: { id: { in: [1, 20] } },
    })

    expect(result.docs.map(({ id }) => id).sort((a, b) => Number(a) - Number(b))).toEqual([1, 20])
    expect(graph.get({ collection: docsSlug, id: 2 })).toMatchObject({
      id: 2,
      rank: 102,
      title: { en: 'live 2', fr: 'brouillon 2' },
    })
    expect(graph.get({ collection: tagsSlug, id: 100 })).toMatchObject({
      id: 100,
      owner: 1,
      title: 'visible',
    })
    expect(graph.get({ collection: tagsSlug, id: 200 })).toBeNull()
    expect(() => graph.get({ collection: docsSlug, id: 10 })).toThrow()
    await binding.prepare(`UPDATE "${tagTable}" SET title = 'later' WHERE id = 100`).run()
    try {
      expect(graph.get({ collection: tagsSlug, id: 100 })!.title).toBe('visible')
    } finally {
      await binding.prepare(`UPDATE "${tagTable}" SET title = 'visible' WHERE id = 100`).run()
    }
  })

  it('should apply logical reverse-join predicates, sorting and page counts in the native D1 statement', async () => {
    const req = request()
    const args = {
      branchID,
      collection: docsSlug,
      locale: 'en' as const,
      req,
      where: { id: { equals: 1 } },
    }
    const joined = await queryBranchContent({
      ...args,
      joins: {
        incoming: { count: true, limit: 1, sort: 'id', where: { id: { in: [2, 20] } } },
        tagOwners: { count: true, limit: 1, where: { id: { equals: 100 } } },
      },
    })

    expect(joined.docs[0]!.incoming).toMatchObject({ docs: [2], totalDocs: 2, hasNextPage: true })
    expect(joined.docs[0]!.tagOwners).toMatchObject({
      docs: [100],
      totalDocs: 1,
      hasNextPage: false,
    })
    req.context.docAccess = { id: { not_equals: 20 } }
    const filtered = await queryBranchContent({
      ...args,
      joins: { incoming: { count: true, limit: 1, sort: 'id', where: { id: { in: [2, 20] } } } },
    })

    expect(filtered.docs[0]!.incoming).toMatchObject({
      docs: [2],
      totalDocs: 1,
      hasNextPage: false,
    })
  })

  it('should route ordinary root relationships through the selected branch and target visibility', async () => {
    const req = request()
    const args = {
      branchID,
      collection: tagsSlug,
      locale: 'fr' as const,
      req,
      joins: false as const,
    }

    expect(
      (
        await queryBranchContent({ ...args, where: { 'owner.title': { equals: 'brouillon 1' } } })
      ).docs.map(({ id }) => id),
    ).toEqual([100])
    expect(
      (await queryBranchContent({ ...args, where: { 'owner.rank': { equals: 1 } } })).docs.map(
        ({ id }) => id,
      ),
    ).toEqual([100])
    req.context.docAccess = false
    expect(
      (await queryBranchContent({ ...args, where: { 'owner.rank': { equals: 1 } } })).totalDocs,
    ).toBe(0)
  })

  it('should fail closed when a concurrent ordinary target changes during the real branch query frame', async () => {
    const source = payload.collections[tagsSlug]!.config
    const original = source.access.read

    source.access.read = async ({ req }) => {
      await req.payload.db.find({ collection: tagsSlug, req, where: { id: { equals: 100 } } })
      await binding.prepare(`UPDATE "${tagTable}" SET title = 'changed' WHERE id = 100`).run()
      return true
    }
    try {
      await expect(
        queryBranchContentGraph({
          branchID,
          collection: docsSlug,
          req: request(),
          depth: 1,
          locale: 'en',
          where: { id: { equals: 1 } },
        }),
      ).rejects.toMatchObject({ code: 'branch-projection-conflict' })
    } finally {
      source.access.read = original
      await binding.prepare(`UPDATE "${tagTable}" SET title = 'visible' WHERE id = 100`).run()
    }
  })

  it('should reject a dirty scope before content and retain honest read-only D1 capabilities', async () => {
    expect(await adapter.branching!.capabilities({ req: request() })).toMatchObject({
      atomicBatch: true,
      interactiveTransactions: false,
    })
    await adapter.branching!.withReadSnapshot!({
      req: request(),
      read: async ({ req }) => {
        expect(await req.payload.db.branching!.capabilities({ req })).toMatchObject({
          atomicBatch: false,
          interactiveTransactions: false,
        })
        expect(() => req.payload.db.create({ collection: docsSlug, req, data: {} })).toThrowError(
          expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }),
        )
        expect(() => (req.payload.db as unknown as { client?: unknown }).client).toThrowError(
          expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }),
        )
      },
    })
    await binding
      .prepare(`UPDATE "${stateTable}" SET pending_count = 1 WHERE scope_key = 'locale:fr'`)
      .run()
    try {
      await expect(
        queryBranchContent({ branchID, collection: docsSlug, req: request(), locale: 'fr' }),
      ).rejects.toMatchObject({ code: 'branch-projection-not-ready' })
      expect(
        (await queryBranchContent({ branchID, collection: docsSlug, req: request(), locale: 'en' }))
          .totalDocs,
      ).toBe(3)
    } finally {
      await binding
        .prepare(`UPDATE "${stateTable}" SET pending_count = 0 WHERE scope_key = 'locale:fr'`)
        .run()
    }
  })

  it('should reject an intervening authoritative generation change before releasing cached content', async () => {
    try {
      await expect(
        adapter.branching!.withReadSnapshot!({
          req: request(),
          read: async ({ req }) => {
            const result = await queryBranchContent({
              branchID,
              collection: docsSlug,
              joins: false,
              locale: 'en',
              req,
              where: { id: { equals: 1 } },
            })

            expect(result.docs[0]!.id).toBe(1)
            await binding
              .prepare(
                `UPDATE "${stateTable}" SET generation = generation + 1 WHERE scope_key = 'shared'`,
              )
              .run()
            return result
          },
        }),
      ).rejects.toMatchObject({ code: 'branch-projection-conflict' })
    } finally {
      await binding
        .prepare(`UPDATE "${stateTable}" SET generation = 1 WHERE scope_key = 'shared'`)
        .run()
    }
  })
})
