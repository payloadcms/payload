import type { Client } from '@libsql/client'
import type { Field, Where, FlattenedJoinField } from 'payload'

import { createClient } from '@libsql/client'
import { count, eq, like, notLike } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { flattenAllFields } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter } from '../types.js'
import type { ProjectionQueryAdapter } from './createProjectionQueries.js'

import { buildPolymorphicJoinQuery } from '../find/buildPolymorphicJoinQuery.js'
import { buildQuery } from '../queries/buildQuery.js'
import { operatorMap } from '../queries/operatorMap.js'
import { createProjectionQueries, projectionQueryContext } from './createProjectionQueries.js'

const documents = sqliteTable('projection_documents', {
  id: text('id').primaryKey(),
  _branchProjection_branchKey: text('branch_key'),
  _branchProjection_isVisible: integer('visible', { mode: 'boolean' }),
  _branchProjection_logicalID: integer('logical_id'),
  owner: text('owner'),
  tag: integer('tag'),
  title: text('title'),
})
const links = sqliteTable('projection_documents_rels', {
  id: integer('id').primaryKey(),
  parent: text('parent_id'),
  path: text('path'),
  'projection-documentsID': text('target_id'),
  ordinaryID: integer('ordinary_id'),
})
const ordinary = sqliteTable('ordinary', {
  id: integer('id').primaryKey(),
  owner: integer('owner'),
})
const originalDocuments = sqliteTable('documents', {
  id: integer('id').primaryKey(),
  title: text('title'),
})
const ordinaryLinks = sqliteTable('ordinary_rels', {
  id: integer('id').primaryKey(),
  parent: integer('parent_id'),
  path: text('path'),
  documentsID: integer('documents_id'),
  ordinaryID: integer('ordinary_id'),
  'text-documentsID': text('text_documents_id'),
})
const textDocuments = sqliteTable('text_documents', { id: text('id').primaryKey() })
const projectionTextDocuments = sqliteTable('projection_text_documents', {
  id: text('id').primaryKey(),
  _branchProjection_branchKey: text('branch_key'),
  _branchProjection_isVisible: integer('visible', { mode: 'boolean' }),
  _branchProjection_logicalID: text('logical_id'),
})
const ordinaryFields: Field[] = [
  { name: 'id', type: 'number' },
  {
    name: 'polyMixed',
    type: 'relationship',
    relationTo: ['documents', 'text-documents'],
    hasMany: true,
  },
  { name: 'owner', type: 'relationship', relationTo: 'documents' },
  { name: 'ownedDocs', type: 'join', collection: 'documents', on: 'tag' },
  { name: 'manyOwnedDocs', type: 'join', collection: 'documents', on: 'tags', hasMany: true },
  { name: 'owners', type: 'relationship', relationTo: 'documents', hasMany: true },
  {
    name: 'polyOwners',
    type: 'relationship',
    relationTo: ['documents', 'ordinary'],
    hasMany: true,
  },
]
const fields: Field[] = [
  { name: 'id', type: 'text' },
  { name: 'title', type: 'text' },
  { name: 'owner', type: 'relationship', relationTo: 'projection-documents' },
  { name: 'tag', type: 'relationship', relationTo: 'ordinary' },
  { name: 'tags', type: 'relationship', relationTo: 'ordinary', hasMany: true },
  {
    name: 'poly',
    type: 'relationship',
    relationTo: ['projection-documents', 'ordinary'],
    hasMany: true,
  },
  { name: 'friends', type: 'relationship', relationTo: 'projection-documents', hasMany: true },
  { name: 'owned', type: 'join', collection: 'projection-documents', on: 'owner' },
  {
    name: 'friendedBy',
    type: 'join',
    collection: 'projection-documents',
    on: 'friends',
    hasMany: true,
  },
  {
    name: '_branchProjection',
    type: 'group',
    fields: [
      { name: 'branchKey', type: 'text' },
      { name: 'isVisible', type: 'checkbox' },
      { name: 'logicalID', type: 'number' },
    ],
  },
]
const client: Client = createClient({ url: 'file::memory:' })
const nativeStatements: string[] = []
const db = drizzle(client, {
  schema: { projection_documents: documents, ordinary },
  logger: { logQuery: (query) => nativeStatements.push(query) },
})
const baseAdapter = {
  drizzle: db,
  idType: 'uuid',
  name: 'sqlite',
  operatorHandlers: [],
  operators: { ...operatorMap, contains: like, like, not_like: notLike },
  payload: {
    config: {},
    collections: {
      ordinary: {
        customIDType: 'number',
        config: {
          slug: 'ordinary',
          fields: ordinaryFields,
          flattenedFields: flattenAllFields({ fields: ordinaryFields }),
        },
      },
      documents: {
        customIDType: 'number',
        config: {
          slug: 'documents',
          custom: { branchQueryStorage: { projection: 'projection-documents' } },
          fields: [
            { name: 'id', type: 'number' },
            { name: 'title', type: 'text' },
          ],
          flattenedFields: [
            { name: 'id', type: 'number' },
            { name: 'title', type: 'text' },
          ],
        },
      },
      'text-documents': {
        customIDType: 'text',
        config: {
          slug: 'text-documents',
          custom: { branchQueryStorage: { projection: 'projection-text-documents' } },
          fields: [{ name: 'id', type: 'text' }],
          flattenedFields: [{ name: 'id', type: 'text' }],
        },
      },
      'projection-text-documents': {
        customIDType: 'text',
        config: {
          slug: 'projection-text-documents',
          custom: { branchProjectionStorage: { collection: 'text-documents' } },
          fields: [{ name: 'id', type: 'text' }],
          flattenedFields: flattenAllFields({
            fields: [
              { name: 'id', type: 'text' },
              {
                name: '_branchProjection',
                type: 'group',
                fields: [
                  { name: 'logicalID', type: 'text' },
                  { name: 'branchKey', type: 'text' },
                  { name: 'isVisible', type: 'checkbox' },
                ],
              },
            ],
          }),
        },
      },
      'projection-documents': {
        customIDType: 'text',
        config: {
          slug: 'projection-documents',
          custom: { branchProjectionStorage: { collection: 'documents' } },
          fields,
          flattenedFields: flattenAllFields({ fields }),
        },
      },
    },
  },
  relationshipsSuffix: '_rels',
  tableNameMap: new Map([
    ['projection_documents', 'projection_documents'],
    ['ordinary', 'ordinary'],
    ['documents', 'documents'],
    ['text_documents', 'text_documents'],
    ['projection_text_documents', 'projection_text_documents'],
  ]),
  tables: {
    projection_documents: documents,
    projection_documents_rels: links,
    ordinary,
    documents: originalDocuments,
    ordinary_rels: ordinaryLinks,
    text_documents: textDocuments,
    projection_text_documents: projectionTextDocuments,
  },
} as unknown as DrizzleAdapter

const query = async ({
  where = {},
  access = {},
  sort,
  isMissing = false,
  extraContext = {},
}: {
  where?: Where
  access?: false | Where
  sort?: string
  isMissing?: boolean
  extraContext?: Record<string, unknown>
} = {}) => {
  const adapter = Object.assign(Object.create(baseAdapter), {
    [projectionQueryContext]: {
      branchKey: 'staging',
      relationAccess: isMissing ? {} : { 'projection-documents': access, ordinary: {} },
      ...extraContext,
    },
  }) as ProjectionQueryAdapter
  const built = buildQuery({
    adapter,
    fields: adapter.payload.collections['projection-documents'].config.flattenedFields,
    tableName: 'projection_documents',
    where,
    sort,
  })
  let native = db.selectDistinct({ id: documents.id }).from(documents).$dynamic()

  for (const join of built.joins) {
    native = native[join.type ?? 'leftJoin'](join.table as any, join.condition)
  }

  const rows = await native
    .where(built.where)
    .orderBy(...built.orderBy.map(({ column, order }) => order(column)))
  let counts = db
    .select({ total: count(documents.id) })
    .from(documents)
    .$dynamic()

  for (const join of built.joins) {
    counts = counts[join.type ?? 'leftJoin'](join.table as any, join.condition)
  }

  return { ids: rows.map(({ id }) => id), count: (await counts.where(built.where))[0].total }
}

beforeAll(async () => {
  await client.execute(
    'CREATE TABLE projection_documents (id TEXT PRIMARY KEY, branch_key TEXT, visible INTEGER, logical_id INTEGER, owner TEXT, tag INTEGER, title TEXT)',
  )
  await client.execute(
    'CREATE TABLE projection_documents_rels (id INTEGER PRIMARY KEY, parent_id TEXT, path TEXT, target_id TEXT, ordinary_id INTEGER)',
  )
  await client.execute('CREATE TABLE ordinary (id INTEGER PRIMARY KEY, owner INTEGER)')
  await client.execute('CREATE TABLE documents (id INTEGER PRIMARY KEY, title TEXT)')
  await client.execute(
    'CREATE TABLE ordinary_rels (id INTEGER PRIMARY KEY, parent_id INTEGER, path TEXT, documents_id INTEGER, ordinary_id INTEGER, text_documents_id TEXT)',
  )
  await client.execute('CREATE TABLE text_documents (id TEXT PRIMARY KEY)')
  await client.execute(
    'CREATE TABLE projection_text_documents (id TEXT PRIMARY KEY, branch_key TEXT, visible INTEGER, logical_id TEXT)',
  )
  await db.insert(ordinary).values([10, 20, 30, 40, 50, 60, 70, 80].map((id) => ({ id, owner: 2 })))
  await db.insert(projectionTextDocuments).values(
    ['2', '10', '20'].map((id) => ({
      id: `private-${id}`,
      _branchProjection_branchKey: 'staging',
      _branchProjection_isVisible: true,
      _branchProjection_logicalID: id,
    })),
  )
  await db.insert(originalDocuments).values([
    { id: 1, title: 'published alpha' },
    { id: 2, title: 'published beta' },
    { id: 3, title: 'published concealed' },
  ])
  await db.insert(ordinaryLinks).values([
    { parent: 10, path: 'polyMixed', documentsID: 2 },
    { parent: 10, path: 'polyMixed', 'text-documentsID': '2' },
    { parent: 20, path: 'polyMixed', documentsID: 1 },
    { parent: 20, path: 'polyMixed', 'text-documentsID': '10' },
    { parent: 30, path: 'polyMixed', 'text-documentsID': '2' },
    { parent: 40, path: 'polyMixed', 'text-documentsID': '10' },
    { parent: 50, path: 'polyMixed', documentsID: 2 },
    { parent: 70, path: 'polyMixed', documentsID: 3 },
    { parent: 80, path: 'polyMixed', documentsID: 1 },
    { parent: 80, path: 'polyMixed', 'text-documentsID': '20' },
    { parent: 10, path: 'owners', documentsID: 2 },
    { parent: 10, path: 'owners', documentsID: 3 },
    { parent: 10, path: 'polyOwners', documentsID: 2 },
    { parent: 10, path: 'polyOwners', documentsID: 3 },
    { parent: 10, path: 'polyOwners', ordinaryID: 10 },
  ])
  await db.insert(documents).values([
    {
      id: 'a',
      _branchProjection_branchKey: 'staging',
      _branchProjection_isVisible: true,
      _branchProjection_logicalID: 1,
      title: 'alpha',
      owner: 'b',
    },
    {
      id: 'b',
      _branchProjection_branchKey: 'staging',
      _branchProjection_isVisible: true,
      _branchProjection_logicalID: 2,
      title: 'beta',
      owner: 'a',
      tag: 10,
    },
    {
      id: 'c',
      _branchProjection_branchKey: 'staging',
      _branchProjection_isVisible: false,
      _branchProjection_logicalID: 3,
      title: 'concealed',
      owner: 'a',
      tag: 10,
    },
    {
      id: 'd',
      _branchProjection_branchKey: 'main',
      _branchProjection_isVisible: true,
      _branchProjection_logicalID: 4,
      title: 'different branch',
      owner: 'a',
    },
    {
      id: 'e',
      _branchProjection_branchKey: 'staging',
      _branchProjection_isVisible: true,
      _branchProjection_logicalID: 5,
      title: 'empty',
      owner: 'c',
    },
  ])
  await db.insert(links).values([
    { parent: 'a', path: 'poly', 'projection-documentsID': 'b' },
    { parent: 'b', path: 'tags', ordinaryID: 10 },
    { parent: 'c', path: 'tags', ordinaryID: 10 },
    { parent: 'b', path: 'poly', 'projection-documentsID': 'c' },
    { parent: 'b', path: 'poly', ordinaryID: 10 },
    { parent: 'e', path: 'poly', 'projection-documentsID': 'a' },
    { parent: 'a', path: 'friends', 'projection-documentsID': 'b' },
    { parent: 'a', path: 'friends', 'projection-documentsID': 'c' },
    { parent: 'b', path: 'friends', 'projection-documentsID': 'c' },
    { parent: 'c', path: 'friends', 'projection-documentsID': 'a' },
    { parent: 'd', path: 'friends', 'projection-documentsID': 'a' },
  ])
})
afterAll(() => client.close())

describe('native effective projection constraints', () => {
  it('should filter branch and visibility before root count and sort', async () => {
    expect(await query({ sort: 'title' })).toEqual({ ids: ['a', 'b', 'e'], count: 3 })
  })
  it('should deny missing and false access predicates', async () => {
    expect((await query({ access: false })).ids).toEqual([])
    expect((await query({ isMissing: true })).ids).toEqual([])
  })
  it('should apply original access before root predicates', async () => {
    expect((await query({ access: { title: { not_equals: 'beta' } } })).ids.sort()).toEqual([
      'a',
      'e',
    ])
  })
  it('should suppress concealed forward relationship IDs and preserve nullable semantics', async () => {
    expect((await query({ where: { owner: { equals: 'c' } } })).ids).toEqual([])
    expect((await query({ where: { owner: { equals: null } } })).ids).toEqual(['e'])
    expect((await query({ where: { 'owner.title': { equals: 'concealed' } } })).ids).toEqual([])
  })
  it('should preserve OR and negative left join semantics', async () => {
    expect(
      (
        await query({
          where: {
            or: [{ 'owner.title': { equals: 'concealed' } }, { title: { equals: 'beta' } }],
          },
        })
      ).ids,
    ).toEqual(['b'])
    expect((await query({ where: { 'owner.title': { not_equals: 'beta' } } })).ids.sort()).toEqual([
      'b',
      'e',
    ])
  })
  it('should evaluate universal and negative hasMany operators over visible related rows', async () => {
    expect(
      (await query({ where: { friends: { contains: { title: { equals: 'concealed' } } } } })).ids,
    ).toEqual([])
    expect(
      (await query({ where: { friends: { equals: { title: { equals: 'beta' } } } } })).ids.sort(),
    ).toEqual(['a', 'b', 'e'])
    expect(
      (
        await query({ where: { friends: { not_equals: { title: { equals: 'beta' } } } } })
      ).ids.sort(),
    ).toEqual(['b', 'e'])
  })
  it('should guard direct hasMany IDs and reverse join owner IDs', async () => {
    expect((await query({ where: { friends: { equals: 'c' } } })).ids).toEqual([])
    expect((await query({ where: { 'friendedBy.id': { equals: 'c' } } })).ids).toEqual([])
    expect((await query({ where: { 'friendedBy.id': { equals: 'a' } } })).ids).toEqual(['b'])
  })
  it('should compile self relation access once while enforcing policy for user relationship hops', async () => {
    const access: Where = {
      or: [{ title: { equals: 'alpha' } }, { 'owner.title': { equals: 'alpha' } }],
    }

    expect((await query({ access })).ids.sort()).toEqual(['a', 'b'])
    expect(
      (await query({ access, where: { 'owner.title': { equals: 'concealed' } } })).ids,
    ).toEqual([])
    expect((await query({ access, where: { 'owner.title': { equals: 'beta' } } })).ids).toEqual([
      'a',
    ])
  })
  it('should enforce related policies on user hops without recursively applying them inside trusted policy expressions', async () => {
    const access: Where = { 'owner.title': { equals: 'beta' } }

    expect((await query({ access })).ids).toEqual(['a'])
    expect((await query({ access, where: { 'owner.title': { equals: 'beta' } } })).ids).toEqual([])
    expect((await query({ access, where: { owner: { equals: 'b' } } })).ids).toEqual([])
    expect((await query({ access: { 'owner.title': { equals: 'concealed' } } })).ids).toEqual([])
  })
  it('should ignore forged public compiler mode flags', async () => {
    expect(
      (
        await query({
          access: false,
          extraContext: { isCompilingAccess: true, projectionCompilingAccess: true },
        })
      ).ids,
    ).toEqual([])
  })
  it('should keep concurrent native distinct contexts isolated from the shared adapter', async () => {
    const queries = createProjectionQueries({ adapter: baseAdapter })
    const [staging, main, denied] = await Promise.all([
      queries.findDistinct({
        collection: 'projection-documents',
        field: 'title',
        context: { branchKey: 'staging', relationAccess: { 'projection-documents': {} } },
      }),
      queries.findDistinct({
        collection: 'projection-documents',
        field: 'title',
        context: { branchKey: 'main', relationAccess: { 'projection-documents': {} } },
      }),
      queries.findDistinct({
        collection: 'projection-documents',
        field: 'title',
        context: { branchKey: 'staging', relationAccess: {} },
      }),
    ])

    expect(staging.values).toEqual([{ title: 'alpha' }, { title: 'beta' }, { title: 'empty' }])
    expect(main.values).toEqual([{ title: 'different branch' }])
    expect(denied.values).toEqual([])
    expect((baseAdapter as ProjectionQueryAdapter)[projectionQueryContext]).toBeUndefined()
  })
  it('should apply effective target guards inside polymorphic join predicates and counts', async () => {
    const adapter = Object.assign(Object.create(baseAdapter), {
      [projectionQueryContext]: {
        branchKey: 'staging',
        relationAccess: { 'projection-documents': {} },
      },
    }) as ProjectionQueryAdapter
    const run = async (where: Where, parentID: string) => {
      const join = buildPolymorphicJoinQuery({
        adapter,
        currentTableName: 'projection_documents',
        field: {
          type: 'join',
          name: 'owned',
          collection: ['projection-documents'],
          on: 'owner',
        } as FlattenedJoinField,
        limit: 1,
        locale: undefined,
        path: '',
        shouldCount: true,
        sort: 'title',
        where,
      })
      const result = await db
        .select({ docs: join.documents, total: join.count })
        .from(documents)
        .where(eq(documents.id, parentID))

      return { docs: JSON.parse(result[0].docs as string), total: result[0].total }
    }

    expect(await run({}, 'a')).toEqual({
      docs: [{ id: 2, relationTo: 'projection-documents' }],
      total: 1,
    })
    expect(await run({ owner: { equals: 'c' } }, 'c')).toEqual({ docs: [], total: 0 })
    expect(await run({ title: { equals: 'concealed' } }, 'a')).toEqual({ docs: [], total: 0 })
  })

  it('should select a sorted page and its total in one native relational statement', async () => {
    const queries = createProjectionQueries({ adapter: baseAdapter })

    nativeStatements.length = 0

    const result = await queries.find({
      collection: 'projection-documents',
      limit: 1,
      page: 2,
      sort: 'title',
      select: { title: true, _branchProjection: true },
      joins: false,
      context: { branchKey: 'staging', relationAccess: { 'projection-documents': {} } },
    })

    expect(result.docs).toMatchObject([{ id: 'b', title: 'beta' }])
    expect(result.totalDocs).toBe(3)
    expect(result.totalPages).toBe(3)
    expect(result.hasNextPage).toBe(true)
    expect(nativeStatements).toHaveLength(1)
    expect(result.docs[0]).not.toHaveProperty('projectionTotal')
  })

  it('should compare ambiguous polymorphic values as typed logical IDs alongside ordinary targets', async () => {
    expect((await query({ where: { 'poly.value': { greater_than: 1 } } })).ids.sort()).toEqual([
      'a',
      'b',
    ])
    expect((await query({ where: { 'poly.value': { less_than: 2 } } })).ids).toEqual(['e'])
    expect((await query({ where: { 'poly.value': { in: [2, 10] } } })).ids.sort()).toEqual([
      'a',
      'b',
    ])
    expect((await query({ where: { 'poly.value': { equals: 3 } } })).ids).toEqual([])
  })

  it('should apply ordinary target policies and deny missing ordinary policy context', async () => {
    for (const ordinaryAccess of [undefined, false, { id: { less_than: 10 } }]) {
      expect(
        (
          await query({
            where: { 'poly.value': { equals: 10 } },
            extraContext: {
              relationAccess: {
                'projection-documents': {},
                ...(ordinaryAccess === undefined ? {} : { ordinary: ordinaryAccess }),
              },
            },
          })
        ).ids,
      ).toEqual([])
    }

    expect(
      (
        await query({
          where: { 'poly.value': { equals: 10 } },
          extraContext: {
            relationAccess: {
              'projection-documents': {},
              ordinary: { id: { greater_than_equal: 10 } },
            },
          },
        })
      ).ids,
    ).toEqual(['b'])
  })

  it('should route ordinary target policies back to effective branch content', async () => {
    for (const ordinaryAccess of [
      { 'owner.title': { equals: 'beta' } },
      { 'ownedDocs.title': { equals: 'beta' } },
      { 'manyOwnedDocs.title': { equals: 'beta' } },
      { owners: { contains: { title: { equals: 'beta' } } } },
      { 'owners._branchProjection.logicalID': { equals: 2 } },
      { 'polyOwners.value': { equals: 2 } },
      { 'polyOwners.value': { greater_than: 1 } },
      { polyOwners: { equals: { relationTo: 'documents', value: 2 } } },
    ] as Where[]) {
      expect(
        (
          await query({
            where: { 'poly.value': { equals: 10 } },
            extraContext: {
              relationAccess: { 'projection-documents': {}, ordinary: ordinaryAccess },
            },
          })
        ).ids,
      ).toEqual(['b'])
    }
  })

  it('should suppress hidden logical targets even inside ordinary trusted access expressions', async () => {
    for (const ordinaryAccess of [
      { 'owner.title': { equals: 'published beta' } },
      { 'ownedDocs.title': { equals: 'concealed' } },
      { 'manyOwnedDocs.title': { equals: 'concealed' } },
      { owners: { contains: { title: { equals: 'concealed' } } } },
      { 'owners._branchProjection.logicalID': { equals: 3 } },
      { 'polyOwners.value': { equals: 3 } },
      { polyOwners: { equals: { relationTo: 'documents', value: 3 } } },
    ] as Where[]) {
      expect(
        (
          await query({
            where: { 'poly.value': { equals: 10 } },
            extraContext: {
              relationAccess: { 'projection-documents': {}, ordinary: ordinaryAccess },
            },
          })
        ).ids,
      ).toEqual([])
    }
  })

  it('should keep ordinary published traversal unchanged without the private query context', async () => {
    const built = buildQuery({
      adapter: baseAdapter,
      fields: baseAdapter.payload.collections.ordinary.config.flattenedFields,
      tableName: 'ordinary',
      where: { 'owner.title': { equals: 'published beta' } },
    })
    let native = db.selectDistinct({ id: ordinary.id }).from(ordinary).$dynamic()

    for (const join of built.joins)
      native = native[join.type ?? 'leftJoin'](join.table as any, join.condition)

    expect((await native.where(built.where)).map(({ id }) => id)).toHaveLength(8)
  })

  it('should enforce branch policies on ordinary user hops and terminate mixed trusted policy cycles', async () => {
    const queries = createProjectionQueries({ adapter: baseAdapter })
    const denied = await queries.find({
      collection: 'ordinary',
      context: {
        branchKey: 'staging',
        relationAccess: { ordinary: {}, 'projection-documents': false },
      },
      limit: 0,
      where: { 'owner.title': { equals: 'beta' } },
      select: { id: true },
      joins: false,
    })
    const trusted = await queries.find({
      collection: 'ordinary',
      context: {
        branchKey: 'staging',
        relationAccess: {
          ordinary: { 'owner.tag.owner.title': { equals: 'beta' } },
          'projection-documents': false,
        },
      },
      limit: 0,
      select: { id: true },
      joins: false,
    })

    expect(denied.docs).toEqual([])
    expect(trusted.docs).toHaveLength(8)
  })

  it('should sort ordinary polymorphic logical IDs by native type and value before root pagination', async () => {
    const queries = createProjectionQueries({ adapter: baseAdapter })
    const context = {
      branchKey: 'staging',
      relationAccess: { ordinary: {}, 'projection-documents': {}, 'projection-text-documents': {} },
    }
    const ascending = await queries.find({
      collection: 'ordinary',
      context,
      limit: 0,
      sort: ['polyMixed.value', 'id'],
      select: { id: true },
      joins: false,
    })
    const descending = await queries.find({
      collection: 'ordinary',
      context,
      limit: 0,
      sort: ['-polyMixed.value', 'id'],
      select: { id: true },
      joins: false,
    })

    expect(ascending.docs.map(({ id }) => id)).toEqual([60, 70, 20, 80, 10, 50, 40, 30])
    expect(descending.docs.map(({ id }) => id)).toEqual([80, 10, 30, 20, 40, 50, 60, 70])
    const page = await queries.find({
      collection: 'ordinary',
      context,
      limit: 2,
      page: 2,
      sort: ['polyMixed.value', 'id'],
      select: { id: true },
      joins: false,
    })

    expect(page.docs.map(({ id }) => id)).toEqual([20, 80])
    expect(page.totalDocs).toBe(8)
  })

  it('should preserve numeric and text logical IDs in ordinary polymorphic distinct values', async () => {
    const queries = createProjectionQueries({ adapter: baseAdapter })
    const result = await queries.findDistinct({
      collection: 'ordinary',
      field: 'polyMixed',
      context: {
        branchKey: 'staging',
        relationAccess: {
          ordinary: {},
          'projection-documents': {},
          'projection-text-documents': {},
        },
      },
    })

    expect(result.values).toEqual(
      expect.arrayContaining([
        { polyMixed: { relationTo: 'documents', value: 2 } },
        { polyMixed: { relationTo: 'text-documents', value: '2' } },
      ]),
    )
    expect(result.values).not.toContainEqual({ polyMixed: { relationTo: 'documents', value: 3 } })
  })

  it('should preserve numeric and text scalar IDs in polymorphic value distinct pages', async () => {
    const queries = createProjectionQueries({ adapter: baseAdapter })
    const context = {
      branchKey: 'staging',
      relationAccess: { ordinary: {}, 'projection-documents': {}, 'projection-text-documents': {} },
    }
    const result = await queries.findDistinct({
      collection: 'ordinary',
      field: 'polyMixed.value',
      context,
    })

    expect(result.values).toEqual([
      { 'polyMixed.value': null },
      { 'polyMixed.value': 1 },
      { 'polyMixed.value': 2 },
      { 'polyMixed.value': '10' },
      { 'polyMixed.value': '2' },
      { 'polyMixed.value': '20' },
    ])
    expect(result.totalDocs).toBe(6)
    const page = await queries.findDistinct({
      collection: 'ordinary',
      field: 'polyMixed.value',
      context,
      limit: 2,
      page: 2,
    })

    expect(page.values).toEqual([{ 'polyMixed.value': 2 }, { 'polyMixed.value': '10' }])
    expect(page.totalDocs).toBe(6)
  })

  it('should return paged distinct values and a coherent window total in one native statement', async () => {
    const queries = createProjectionQueries({ adapter: baseAdapter })

    nativeStatements.length = 0

    const result = await queries.findDistinct({
      collection: 'projection-documents',
      field: 'title',
      limit: 1,
      page: 2,
      context: { branchKey: 'staging', relationAccess: { 'projection-documents': {} } },
    })

    expect(result.values).toEqual([{ title: 'beta' }])
    expect(result.totalDocs).toBe(3)
    expect(result.totalPages).toBe(3)
    expect(nativeStatements).toHaveLength(1)
  })
  it('should preserve the full count for a checked empty page', async () => {
    const queries = createProjectionQueries({ adapter: baseAdapter })
    const result = await queries.find({
      collection: 'projection-documents',
      limit: 1,
      page: 4,
      select: { title: true },
      joins: false,
      context: { branchKey: 'staging', relationAccess: { 'projection-documents': {} } },
    })

    expect(result.docs).toEqual([])
    expect(result.totalDocs).toBe(3)
    expect(result.hasNextPage).toBe(false)
  })
  it('should reject an empty raw page when the fallback count proves the page became nonempty', async () => {
    const queries = createProjectionQueries({ adapter: baseAdapter })
    const originalFindMany = db.query.projection_documents.findMany.bind(
      db.query.projection_documents,
    )
    const spy = vi
      .spyOn(db.query.projection_documents, 'findMany')
      .mockImplementationOnce((args) => {
        const query = originalFindMany(args)
        query.execute = async () => []
        return query
      })

    try {
      await expect(
        queries.find({
          collection: 'projection-documents',
          limit: 1,
          page: 1,
          select: { title: true },
          joins: false,
          context: { branchKey: 'staging', relationAccess: { 'projection-documents': {} } },
        }),
      ).rejects.toMatchObject({ code: 'branch-projection-conflict' })
    } finally {
      spy.mockRestore()
    }
  })
})
