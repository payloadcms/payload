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

const build = () => {
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
            read: ({ req }) => (req.user ? tenantWhere : false),
            update: ({ req }) => (req.user ? tenantWhere : false),
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
      count: async ({ collection: slug, where }) => ({
        totalDocs: (slug === 'pages' ? pages : []).filter((d) => matches(d, where)).length,
      }),
      find: async ({ collection: slug, where }) => {
        const source = slug === lockedDocumentsCollectionSlug ? locks : pages
        return { docs: source.filter((d) => !where || matches(d, where)) }
      },
    },
  }

  const reqFor = (user?: object) => ({ payload, user }) as unknown as PayloadRequest

  return { access: collection.access!, reqFor }
}

const visible = async (where: boolean | Where) =>
  where === false || where === true
    ? where
    : locks.filter((l) => matches(l, where)).map((l) => l.id)

describe('payload-locked-documents access', () => {
  const user = { id: 1, collection: 'users' }

  it('read: only lock rows for targets the user can read', async () => {
    const { access, reqFor } = build()
    const where = await access.read!({ req: reqFor(user) } as any)
    expect(await visible(where)).toEqual([10, 12])
  })

  it('read: returns an empty-matching Where (not false) when only another tenant holds locks', async () => {
    const { access, reqFor } = build()
    const tenantBOnly = [locks[1]!]
    const req = reqFor(user)
    ;(req.payload.db as any).find = async ({ collection: slug, where }: any) => {
      const source = slug === lockedDocumentsCollectionSlug ? tenantBOnly : pages
      return { docs: source.filter((d) => !where || matches(d, where)) }
    }
    const where = await access.read!({ req } as any)
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

  it('create: requires update access to the target document', async () => {
    const { access, reqFor } = build()
    const create = (data: object) => access.create!({ data, req: reqFor(user) } as any)
    expect(await create({ document: { relationTo: 'pages', value: 1 } })).toBe(true)
    expect(await create({ document: { relationTo: 'pages', value: 2 } })).toBe(false)
    expect(await create({ document: { relationTo: 'unknown', value: 1 } })).toBe(false)
    expect(await create({})).toBe(false)
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
