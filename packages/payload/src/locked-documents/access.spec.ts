import { describe, expect, it } from 'vitest'

import type { Config } from '../config/types.js'
import type { PayloadRequest, Where } from '../types/index.js'

import { getLockedDocumentsCollection, lockedDocumentsCollectionSlug } from './config.js'

const pages = [
  { id: 1, tenant: 'A' },
  { id: 2, tenant: 'B' },
]

const locks = [
  { id: 10, document: { relationTo: 'pages', value: 1 }, user: { relationTo: 'users', value: 1 } },
  { id: 11, document: { relationTo: 'pages', value: 2 }, user: { relationTo: 'users', value: 2 } },
  { id: 12, globalSlug: 'settings', user: { relationTo: 'users', value: 2 } },
  { id: 13, globalSlug: 'private', user: { relationTo: 'users', value: 2 } },
]

// Minimal evaluator for the Where shapes used by the access functions
const matches = (doc: any, where: Where): boolean => {
  if (where.and) {
    return (where.and as Where[]).every((w) => matches(doc, w))
  }
  if (where.or) {
    return (where.or as Where[]).some((w) => matches(doc, w))
  }
  return Object.entries(where).every(([key, op]: [string, any]) => {
    const value =
      key === 'document.value'
        ? doc.document?.value
        : key === 'document.relationTo'
          ? doc.document?.relationTo
          : doc[key]
    if ('equals' in op) {
      return value === op.equals
    }
    if ('in' in op) {
      return op.in.includes(value)
    }
    if ('exists' in op) {
      return op.exists ? value !== undefined && value !== null : value === undefined || value === null
    }
    return false
  })
}

const tenantWhere: Where = { tenant: { equals: 'A' } }

const build = (overrides?: {
  dbLocks?: typeof locks
  pagesRead?: (...args: any[]) => any
  pagesUpdate?: (...args: any[]) => any
}) => {
  const activeLocks = overrides?.dbLocks ?? locks
  const config = {
    collections: [
      {
        slug: 'users',
        auth: true,
        fields: [],
      },
      { slug: 'pages', fields: [] },
    ],
    globals: [{ slug: 'settings', fields: [] }, { slug: 'private', fields: [] }],
  } as unknown as Config
  const collection = getLockedDocumentsCollection(config)!

  const payload: any = {
    collections: {
      pages: {
        config: {
          access: {
            read: overrides?.pagesRead ?? (({ req }: any) => (req.user ? tenantWhere : false)),
            update: overrides?.pagesUpdate ?? (({ req }: any) => (req.user ? tenantWhere : false)),
          },
        },
      },
    },
    config: {
      globals: [
        { slug: 'settings', access: { read: () => true, update: () => true } },
        { slug: 'private', access: { read: () => false, update: () => false } },
      ],
    },
    db: {
      count: async ({ collection: slug, where }: any) => ({
        totalDocs: (slug === 'pages' ? pages : []).filter((d) => matches(d, where)).length,
      }),
      find: async ({ collection: slug, where }: any) => {
        const source = slug === lockedDocumentsCollectionSlug ? activeLocks : pages
        return { docs: source.filter((d) => !where || matches(d, where)) }
      },
    },
  }

  const reqFor = (user?: object) => ({ payload, user }) as unknown as PayloadRequest

  return { access: collection.access!, payload, reqFor }
}

const visible = async (where: boolean | Where, source = locks) =>
  where === false || where === true
    ? where
    : source.filter((l) => matches(l, where)).map((l) => l.id)

describe('payload-locked-documents access', () => {
  const user = { id: 1, collection: 'users' }

  it('read: only lock rows for targets the user can read', async () => {
    const { access, reqFor } = build()
    const where = await access.read!({ req: reqFor(user) } as any)
    expect(await visible(where)).toEqual([10, 12])
  })

  it('read: returns an empty-matching Where (not false) when only another tenant holds locks', async () => {
    const tenantBOnly = [locks[1]!]
    const { access, reqFor } = build({ dbLocks: tenantBOnly })
    const where = await access.read!({ req: reqFor(user) } as any)
    expect(where).not.toBe(false)
    expect(tenantBOnly.filter((l) => matches(l, where as Where))).toEqual([])
  })

  it('read by id: a lock on another tenant document is not accessible', async () => {
    const { access, reqFor } = build()
    expect(await visible(await access.read!({ id: 11, req: reqFor(user) } as any))).toEqual([])
    expect(await visible(await access.read!({ id: 10, req: reqFor(user) } as any))).toEqual([10])
  })

  it('update and delete by id: restricted to own tenant and readable globals', async () => {
    const { access, reqFor } = build()
    for (const op of ['update', 'delete'] as const) {
      expect(await visible(await access[op]!({ id: 11, req: reqFor(user) } as any))).toEqual([])
      expect(await visible(await access[op]!({ id: 10, req: reqFor(user) } as any))).toEqual([10])
      expect(await visible(await access[op]!({ id: 13, req: reqFor(user) } as any))).toEqual([])
    }
  })

  it('bulk delete and update (no id): scoped to accessible rows', async () => {
    const { access, reqFor } = build()
    for (const op of ['update', 'delete'] as const) {
      expect(await visible(await access[op]!({ req: reqFor(user) } as any))).toEqual([10, 12])
    }
  })

  it('evaluates collection access with each target document id and batches Where clauses', async () => {
    const seenIds: unknown[] = []
    const eqAllow = build({
      pagesRead: ({ id }: any) => {
        seenIds.push(id)
        return id === 1
      },
      pagesUpdate: ({ id }: any) => id === 1,
    })
    expect(await visible(await eqAllow.access.read!({ req: eqAllow.reqFor(user) } as any))).toEqual([
      10, 12,
    ])
    expect(seenIds).toEqual([1, 2])
    expect(
      await visible(await eqAllow.access.update!({ req: eqAllow.reqFor(user) } as any)),
    ).toEqual([10, 12])

    const neqDeny = build({
      pagesRead: ({ id }: any) => id !== 2,
      pagesUpdate: ({ id }: any) => id !== 2,
    })
    expect(await visible(await neqDeny.access.read!({ req: neqDeny.reqFor(user) } as any))).toEqual([
      10, 12,
    ])
    expect(
      await visible(await neqDeny.access.update!({ req: neqDeny.reqFor(user) } as any)),
    ).toEqual([10, 12])

    // Per-ID Where clauses stay bound to their own targetId inside a single db.find call
    let pageFindCalls = 0
    const wherePerId = build({
      pagesRead: ({ id }: any) => (id === 1 ? { tenant: { equals: 'A' } } : false),
    })
    const origFind = wherePerId.payload.db.find
    wherePerId.payload.db.find = async (args: any) => {
      if (args.collection === 'pages') {
        pageFindCalls += 1
      }
      return origFind(args)
    }
    expect(
      await visible(await wherePerId.access.read!({ req: wherePerId.reqFor(user) } as any)),
    ).toEqual([10, 12])
    expect(pageFindCalls).toBe(1)
  })

  it('rejects dual-target rows on create and ignores them on read, update, and delete', async () => {
    const { access, reqFor } = build()
    const create = (data: object) => access.create!({ data, req: reqFor(user) } as any)
    expect(
      await create({
        document: { relationTo: 'pages', value: 1 },
        globalSlug: 'settings',
      }),
    ).toBe(false)
    expect(await create({ document: {}, globalSlug: 'settings' })).toBe(false)
    expect(await create({ document: null, globalSlug: 'settings' })).toBe(true)

    const withDualTarget = [
      ...locks,
      {
        id: 14,
        document: { relationTo: 'pages', value: 2 },
        globalSlug: 'settings',
        user: { relationTo: 'users', value: 2 },
      },
      {
        id: 15,
        document: { relationTo: 'pages', value: 1 },
        globalSlug: 'settings',
        user: { relationTo: 'users', value: 1 },
      },
    ]
    const dual = build({ dbLocks: withDualTarget })
    for (const op of ['read', 'update', 'delete'] as const) {
      expect(
        await visible(await dual.access[op]!({ req: dual.reqFor(user) } as any), withDualTarget),
      ).toEqual([10, 12])
      expect(
        await visible(
          await dual.access[op]!({ id: 14, req: dual.reqFor(user) } as any),
          withDualTarget,
        ),
      ).toEqual([])
      expect(
        await visible(
          await dual.access[op]!({ id: 15, req: dual.reqFor(user) } as any),
          withDualTarget,
        ),
      ).toEqual([])
    }
  })

  it('update: validates destination target on retargeting and rejects dual/targetless merges', async () => {
    const { access, reqFor } = build()
    const req = reqFor(user)

    // Unauthorized destination targets are rejected for both by-ID and bulk updates
    expect(
      await access.update!({ id: 10, data: { document: { relationTo: 'pages', value: 2 } }, req } as any),
    ).toBe(false)
    expect(
      await access.update!({ data: { document: { relationTo: 'pages', value: 2 } }, req } as any),
    ).toBe(false)
    expect(
      await access.update!({ id: 12, data: { globalSlug: 'private' }, req } as any),
    ).toBe(false)
    expect(await access.update!({ data: { globalSlug: 'private' }, req } as any)).toBe(false)

    // Setting both targets or clearing both targets is rejected
    expect(
      await access.update!({
        id: 10,
        data: { document: { relationTo: 'pages', value: 1 }, globalSlug: 'settings' },
        req,
      } as any),
    ).toBe(false)
    expect(
      await access.update!({ data: { document: null, globalSlug: null }, req } as any),
    ).toBe(false)

    // Partial updates that add a second target or clear the only target on a row are rejected
    expect(await access.update!({ id: 10, data: { globalSlug: 'settings' }, req } as any)).toBe(
      false,
    )
    expect(
      await access.update!({ id: 12, data: { document: { relationTo: 'pages', value: 1 } }, req } as any),
    ).toBe(false)
    expect(await access.update!({ id: 10, data: { document: null }, req } as any)).toBe(false)
    expect(await access.update!({ id: 12, data: { globalSlug: null }, req } as any)).toBe(false)

    // Bulk partial target update only scopes to compatible rows
    expect(
      await visible(await access.update!({ data: { globalSlug: 'settings' }, req } as any)),
    ).toEqual([12])
    expect(
      await visible(
        await access.update!({ data: { document: { relationTo: 'pages', value: 1 } }, req } as any),
      ),
    ).toEqual([10])

    // Switching targets while explicitly clearing the old target is allowed
    expect(
      await visible(
        await access.update!({
          id: 10,
          data: { document: null, globalSlug: 'settings' },
          req,
        } as any),
      ),
    ).toEqual([10])
    expect(
      await visible(
        await access.update!({
          id: 12,
          data: { document: { relationTo: 'pages', value: 1 }, globalSlug: null },
          req,
        } as any),
      ),
    ).toEqual([12])

    // Non-target field updates and keeping an authorized target are allowed
    expect(
      await visible(
        await access.update!({
          id: 10,
          data: { user: { relationTo: 'users', value: 1 } },
          req,
        } as any),
      ),
    ).toEqual([10])
    expect(
      await visible(
        await access.update!({
          id: 10,
          data: { document: { relationTo: 'pages', value: 1 } },
          req,
        } as any),
      ),
    ).toEqual([10])
  })

  it('create: requires update access to the target document', async () => {
    const { access, reqFor } = build()
    const create = (data: object) => access.create!({ data, req: reqFor(user) } as any)
    expect(await create({ document: { relationTo: 'pages', value: 1 } })).toBe(true)
    expect(await create({ document: { relationTo: 'pages', value: 2 } })).toBe(false)
    expect(await create({ document: { relationTo: 'unknown', value: 1 } })).toBe(false)
    expect(await create({})).toBe(false)
  })

  it('normalizes populated relationship objects and rejects unsupported target value shapes', async () => {
    const { access, reqFor } = build({
      pagesUpdate: ({ id }: any) => String(id) !== '2',
    })
    const req = reqFor(user)
    expect(
      await access.create!({
        data: { document: { relationTo: 'pages', value: { id: 1 } } },
        req,
      } as any),
    ).toBe(true)
    expect(
      await access.create!({
        data: { document: { relationTo: 'pages', value: { id: 2 } } },
        req,
      } as any),
    ).toBe(false)
    expect(
      await access.update!({
        id: 10,
        data: { document: { relationTo: 'pages', value: { id: 2 } } },
        req,
      } as any),
    ).toBe(false)
    for (const badValue of [{}, { foo: 1 }, [], '', NaN]) {
      expect(
        await access.create!({
          data: { document: { relationTo: 'pages', value: badValue } },
          req,
        } as any),
      ).toBe(false)
    }
  })

  it('binds returned Where filters to each lock target so concurrent retargeting stops matching', async () => {
    const mutableLocks = locks.map((lock) => ({
      ...lock,
      ...(lock.document ? { document: { ...lock.document } } : {}),
    }))
    const { access, reqFor } = build({ dbLocks: mutableLocks })
    const where = await access.read!({ req: reqFor(user) } as any)
    expect(await visible(where, mutableLocks)).toEqual([10, 12])

    // Retargeting lock 10 to unauthorized page 2 or lock 12 to unauthorized global 'private'
    mutableLocks[0]!.document!.value = 2
    mutableLocks[2]!.globalSlug = 'private'
    expect(await visible(where, mutableLocks)).toEqual([])
  })

  it('create: globals follow the global update access', async () => {
    const { access, reqFor } = build()
    const create = (data: object) => access.create!({ data, req: reqFor(user) } as any)
    expect(await create({ globalSlug: 'settings' })).toBe(true)
    expect(await create({ globalSlug: 'private' })).toBe(false)
    expect(await create({ globalSlug: 'missing' })).toBe(false)
  })

  it('denies every operation without a user', async () => {
    const { access, reqFor } = build()
    const req = reqFor()
    expect(await access.read!({ req } as any)).toBe(false)
    expect(await access.update!({ id: 10, req } as any)).toBe(false)
    expect(await access.delete!({ req } as any)).toBe(false)
    expect(await access.create!({ data: { globalSlug: 'settings' }, req } as any)).toBe(false)
  })
})
