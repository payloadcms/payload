import { describe, expect, it, vi } from 'vitest'

import type { MongooseAdapter } from '../index.js'

import { buildProjectionQuery } from './buildProjectionQuery.js'
import { createProjectionQueries } from './createProjectionQueries.js'

const setup = () => {
  const fields = [
    { name: 'id', type: 'text' },
    { name: 'title', type: 'text' },
    { name: 'createdAt', type: 'date' },
    { name: 'position', type: 'point' },
    { name: 'enabled', type: 'checkbox' },
    { name: 'author', type: 'relationship', relationTo: 'authors' },
    { name: 'poly', type: 'relationship', relationTo: ['authors', 'articles'], hasMany: true },
    { name: 'authors', type: 'relationship', relationTo: 'authors', hasMany: true },
    { name: 'articles', type: 'join', collection: 'articles', on: 'author' },
    {
      name: '_branchProjection',
      type: 'group',
      fields: [],
      flattenedFields: [
        { name: 'logicalID', type: 'text' },
        { name: 'branchKey', type: 'text' },
        { name: 'isVisible', type: 'checkbox' },
      ],
    },
  ]
  const aggregate = vi.fn().mockResolvedValue([{ docs: [], values: [], count: [{ totalDocs: 0 }] }])
  const find = vi.fn(() => {
    throw new Error('Application-side identity scans are forbidden.')
  })
  const config = (slug: string) => ({
    slug,
    fields,
    flattenedFields: fields,
    custom: { branchProjectionStorage: { collection: slug } },
    joins: {},
    polymorphicJoins: [],
    timestamps: false,
  })
  const session = { inTransaction: () => true }
  const adapter = {
    payload: {
      config: { localization: false },
      collections: {
        articles: { config: config('articles'), customIDType: 'text' },
        authors: { config: config('authors'), customIDType: 'text' },
      },
    },
    collections: {
      articles: { collection: { name: 'articles_native' }, aggregate, find },
      authors: { collection: { name: 'authors_native' }, aggregate, find },
    },
    sessions: { active: session },
  } as unknown as MongooseAdapter

  return {
    adapter,
    aggregate,
    context: {
      branchKey: 'staging',
      relationAccess: { authors: { enabled: { equals: true } }, articles: {} },
    },
    find,
    session,
  }
}

const lookups = (stages: any[]): any[] =>
  stages.flatMap((stage) =>
    stage.$lookup
      ? [stage.$lookup, ...lookups(stage.$lookup.pipeline ?? [])]
      : stage.$facet
        ? Object.values(stage.$facet).flatMap((pipeline) => lookups(pipeline as any[]))
        : [],
  )

describe('Mongo native effective branch query compiler', () => {
  it('should keep related predicates and access checks in correlated native lookups', async () => {
    const { adapter, context, find } = setup()
    const query = await buildProjectionQuery({
      adapter,
      collection: 'articles',
      context,
      where: {
        or: [{ title: { equals: 'root' } }, { 'author.title': { like: 'Ada Lovelace' } }],
      },
    })
    const relations = lookups(query.stages)

    expect(relations).toHaveLength(1)
    expect(relations[0]).toMatchObject({
      from: 'authors_native',
      foreignField: '_id',
    })
    expect(JSON.stringify(query.stages)).toContain('enabled')
    expect(JSON.stringify(query.stages)).toContain('_branchProjection.branchKey')
    expect(JSON.stringify(query.stages.at(-1))).toContain('$or')
    expect(find).not.toHaveBeenCalled()
  })

  it('should preserve negative and every nested has-many predicates without expanding related IDs', async () => {
    const { adapter, context } = setup()
    const query = await buildProjectionQuery({
      adapter,
      collection: 'articles',
      context,
      where: {
        and: [
          { authors: { equals: { enabled: { equals: true } } } },
          { authors: { not_equals: { title: { equals: 'excluded' } } } },
        ],
      },
    })

    expect(lookups(query.stages)).toHaveLength(2)
    expect(JSON.stringify(query.stages.at(-1))).toContain('$setIsSubset')
    expect(JSON.stringify(query.stages.at(-1))).toContain('"$exists":false')
  })

  it('should deny a private relationship target when its access predicate is missing', async () => {
    const { adapter, context } = setup()
    const query = await buildProjectionQuery({
      adapter,
      collection: 'articles',
      context: { ...context, relationAccess: {} },
      where: { 'author.title': { equals: 'secret' } },
    })

    expect(JSON.stringify(query.stages)).toContain('false')
  })

  it('should apply branch and access guards to each hop of a relationship sort', async () => {
    const { adapter, context } = setup()
    const query = await buildProjectionQuery({ adapter, collection: 'articles', context })
    const sorting = await query.resolvePath({ path: 'author.author.title' })

    expect(lookups(sorting.stages)).toHaveLength(2)
    for (const relation of lookups(sorting.stages)) {
      expect(JSON.stringify(relation.pipeline)).toContain('_branchProjection.branchKey')
      expect(JSON.stringify(relation.pipeline)).toContain('enabled')
    }
  })

  it('should guard direct identity comparisons and preserve reference ordering natively', async () => {
    const { adapter, context, find } = setup()
    const query = await buildProjectionQuery({
      adapter,
      collection: 'articles',
      context,
      where: { authors: { equals: ['a', 'b'] } },
    })

    expect(lookups(query.stages)).toHaveLength(1)
    expect(JSON.stringify(query.stages)).toContain('$filter')
    expect(JSON.stringify(query.stages.at(-1))).toContain('__branchProjectionLookup')
    expect(find).not.toHaveBeenCalled()
  })

  it('should resolve polymorphic logical values through each guarded target without application ID reads', async () => {
    const { adapter, context, find } = setup()
    const query = await buildProjectionQuery({
      adapter,
      collection: 'articles',
      context,
      where: { 'poly.value': { greater_than: 'a' } },
    })
    const path = await query.resolvePath({ path: 'poly.value' })

    expect(lookups(query.stages)).toHaveLength(2)
    expect(lookups(path.stages)).toHaveLength(2)
    expect(JSON.stringify(query.stages)).toContain('$$document._branchProjection.logicalID')
    expect(find).not.toHaveBeenCalled()
  })

  it('should terminate trusted self-relation policy attributes and still guard user relationship hops', async () => {
    const { adapter, context } = setup()
    const query = await buildProjectionQuery({
      adapter,
      collection: 'articles',
      context: {
        ...context,
        relationAccess: {
          articles: { 'author.author.title': { equals: 'owner' } },
          authors: false,
        },
      },
      where: { 'author.title': { equals: 'secret' } },
    })
    const relations = lookups(query.stages)

    expect(relations).toHaveLength(3)
    expect(JSON.stringify(query.stages)).toContain('false')
  })

  it('should count and page from the same effective predicate in one session-bound aggregate', async () => {
    const { adapter, aggregate, context, session } = setup()
    const queries = createProjectionQueries({ adapter })

    await queries.find({
      collection: 'articles',
      context,
      req: { transactionID: Promise.resolve('active') },
      where: { 'author.title': { equals: 'visible' } },
      limit: 5,
      page: 3,
      sort: '_branchProjection.logicalID',
    })

    expect(aggregate).toHaveBeenCalledTimes(1)
    const [pipeline, options] = aggregate.mock.calls[0]!

    expect(options.session).toBe(session)
    expect(pipeline.at(-1).$facet.count).toEqual([{ $count: 'totalDocs' }])
    expect(pipeline.at(-1).$facet.docs).toContainEqual({ $skip: 10 })
    expect(lookups(pipeline)).toHaveLength(1)
  })

  it('should use exact native count for filtered effective content', async () => {
    const { adapter, aggregate, context } = setup()

    aggregate.mockResolvedValueOnce([{ totalDocs: 17 }])
    expect(
      await createProjectionQueries({ adapter }).count({
        collection: 'articles',
        context,
        where: { 'author.title': { not_equals: 'other' } },
      }),
    ).toEqual({ totalDocs: 17 })
    expect(aggregate.mock.calls[0]![0].at(-1)).toEqual({ $count: 'totalDocs' })
  })

  it('should resolve distinct relationship values through guarded native lookups before grouping', async () => {
    const { adapter, aggregate, context } = setup()

    await createProjectionQueries({ adapter }).findDistinct({
      collection: 'articles',
      context,
      field: 'author.title',
      limit: 5,
      page: 2,
    })
    const [pipeline] = aggregate.mock.calls[0]!

    expect(lookups(pipeline)).toHaveLength(2)
    expect(pipeline.find((stage: any) => stage.$group)).toBeDefined()
    expect(pipeline.at(-1).$facet.values).toContainEqual({ $skip: 5 })
  })

  it('should start mandatory root near queries with geoNear before effective filtering', async () => {
    const { adapter, context } = setup()
    const query = await buildProjectionQuery({
      adapter,
      collection: 'articles',
      context,
      where: {
        and: [{ position: { near: [0, 0, 1000, 10] } }, { 'author.title': { equals: 'visible' } }],
      },
    })

    expect(query.stages[0]).toMatchObject({
      $geoNear: {
        key: 'position',
        maxDistance: 1000,
        minDistance: 10,
        query: { '_branchProjection.branchKey': 'staging' },
      },
    })
    expect(lookups(query.stages)).toHaveLength(1)
  })

  it('should reject an optional near predicate instead of changing OR semantics', async () => {
    const { adapter, context } = setup()

    await expect(
      buildProjectionQuery({
        adapter,
        collection: 'articles',
        context,
        where: { or: [{ position: { near: [0, 0, 1000] } }, { title: { equals: 'anywhere' } }] },
      }),
    ).rejects.toThrow('mandatory root near')
  })

  it('should retain scalar like, not-like, null, and localized operator compilation', async () => {
    const { adapter, context } = setup()
    const query = await buildProjectionQuery({
      adapter,
      collection: 'articles',
      context,
      where: {
        and: [
          { title: { not_like: 'literal.* two' } },
          { title: { equals: null } },
          { title: { exists: false } },
        ],
      },
    })

    expect(JSON.stringify(query.stages)).toContain('literal\\\\.\\\\*')
    expect(JSON.stringify(query.stages)).toContain('$not')
    expect(JSON.stringify(query.stages)).toContain('$exists')
  })
  it('should build guarded reverse joins with exact count and page-local identities', async () => {
    const { adapter, context } = setup()
    const config = adapter.payload.collections.authors!.config

    config.joins = {
      articles: [
        {
          joinPath: 'articles',
          field: { name: 'articles', type: 'join', collection: 'articles', on: 'author' },
        },
      ],
    } as never
    const query = await buildProjectionQuery({ adapter, collection: 'authors', context })
    const stages = await query.buildJoins({
      joins: {
        articles: { count: true, limit: 2, page: 3, where: { title: { like: 'visible' } } },
      },
    })
    const relations = lookups(stages)

    expect(relations).toHaveLength(1)
    expect(relations[0].let).toEqual({ rootID: '$_id' })
    expect(JSON.stringify(query.stages)).toContain('_branchProjection.branchKey')
    expect(relations[0].pipeline.at(-1).$facet.count).toEqual([{ $count: 'totalDocs' }])
    expect(relations[0].pipeline.at(-1).$facet.docs).toContainEqual({ $limit: 7 })
    expect(JSON.stringify(stages)).toContain('articles.hasNextPage')
  })

  it('should avoid a facet-sized output document for unpaginated reads', async () => {
    const { adapter, aggregate, context } = setup()

    aggregate.mockResolvedValueOnce([])
    await createProjectionQueries({ adapter }).find({
      collection: 'articles',
      context,
      limit: 0,
      sort: '_branchProjection.logicalID',
    })

    expect(aggregate.mock.calls[0]![0].some((stage: any) => stage.$facet)).toBe(false)
  })

  it('should retain explicit locale relationship hops', async () => {
    const { adapter, context } = setup()

    adapter.payload.config.localization = {
      defaultLocale: 'en',
      localeCodes: ['en', 'fr'],
    } as never
    const field = adapter.payload.collections.articles!.config.flattenedFields.find(
      (field) => field.name === 'author',
    )!

    field.localized = true
    const query = await buildProjectionQuery({
      adapter,
      collection: 'articles',
      context,
      locale: 'en',
      where: { 'author.fr.title': { equals: 'visible' } },
    })

    expect(lookups(query.stages)).toHaveLength(1)
    expect(JSON.stringify(query.stages)).toContain('fr')
  })
})

describe('Mongo bounded raw graph primary-key targeting', () => {
  const setupTarget = () => {
    const fixture = setup()
    const { adapter } = fixture
    adapter.payload.collections.articles!.config.custom.branchProjectionStorage = {
      collection: 'source',
    }
    adapter.payload.collections.source = {
      config: {
        slug: 'source',
        flattenedFields: [],
        custom: { branchQueryStorage: { projection: 'articles' } },
      },
    } as any

    return {
      ...fixture,
      context: {
        ...fixture.context,
        graphTarget: { collection: 'articles', ids: [`bp2:${'a'.repeat(43)}`] },
      },
    }
  }

  it('should retain predicates and access while targeting only the registered root', async () => {
    const { adapter, context } = setupTarget()
    const query = await buildProjectionQuery({
      adapter,
      collection: 'articles',
      context,
      where: { id: { in: ['logical'] } },
    })

    expect(query.stages[1]).toEqual({ $match: { _id: { $in: context.graphTarget.ids } } })
    expect(query.stages[0]).toMatchObject({ $match: { '_branchProjection.branchKey': 'staging' } })
    expect(JSON.stringify(query.stages.at(-1))).toContain('logical')
    expect(query.stages[2]).toEqual({ $match: {} })
  })

  it('should keep geoNear first and insert targeting only after the root geo stage', async () => {
    const { adapter, context } = setupTarget()
    const query = await buildProjectionQuery({
      adapter,
      collection: 'articles',
      context,
      where: { position: { near: [0, 0, 1000] } },
    })

    expect(query.stages[0]).toHaveProperty('$geoNear')
    expect(query.stages[1]).toEqual({ $match: { _id: { $in: context.graphTarget.ids } } })
  })

  it('should target the restored root after an inverse relationship semijoin', async () => {
    const { adapter, context } = setupTarget()
    const query = await buildProjectionQuery({
      adapter,
      collection: 'articles',
      context,
      where: { 'author.title': { equals: 'Ada' } },
    })
    const restoration = query.stages.findIndex(
      (stage) => '$replaceWith' in stage && stage.$replaceWith === '$__branchRoot',
    )
    const target = query.stages.findIndex((stage: any) => stage.$match?._id?.$in)

    expect(restoration).toBeGreaterThan(0)
    expect(target).toBeGreaterThan(restoration)
    expect(query.sourceCollection).toBe('authors')
    expect(JSON.stringify(query.stages)).toContain('enabled')
  })

  it.each([
    'collation',
    'mismatched-collection',
    'ordinary',
    'global',
    'unregistered',
    'empty',
    'oversized',
    'malformed',
  ])('should skip %s hints without changing the logical query', async (mode) => {
    const { adapter, context } = setupTarget()
    if (mode === 'collation') adapter.collation = { strength: 1 }
    if (mode === 'mismatched-collection') context.graphTarget.collection = 'authors'
    if (mode === 'ordinary')
      delete adapter.payload.collections.articles!.config.custom.branchProjectionStorage
    if (mode === 'global')
      adapter.payload.collections.articles!.config.custom.branchProjectionStorage.global =
        'settings'
    if (mode === 'unregistered')
      adapter.payload.collections.source!.config.custom.branchQueryStorage.projection = 'other'
    if (mode === 'empty') context.graphTarget.ids = []
    if (mode === 'oversized') context.graphTarget.ids = Array(51).fill(`bp2:${'a'.repeat(43)}`)
    if (mode === 'malformed') context.graphTarget.ids = ['not-a-private-id']
    const query = await buildProjectionQuery({
      adapter,
      collection: 'articles',
      context,
      where: { title: { equals: 'root' } },
    })

    expect(query.stages.some((stage: any) => stage.$match?._id?.$in)).toBe(false)
    expect(JSON.stringify(query.stages.at(-1))).toContain('root')
  })
})
