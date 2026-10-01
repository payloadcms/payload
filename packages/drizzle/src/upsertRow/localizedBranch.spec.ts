import type { FlattenedField } from 'payload'

import { sql } from 'drizzle-orm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter } from '../types.js'
import type { RowToInsert } from '../transform/write/types.js'

const mocks = vi.hoisted(() => ({
  insertArrays: vi.fn(),
  transformForWrite: vi.fn(),
}))

vi.mock('../transform/write/index.js', () => ({ transformForWrite: mocks.transformForWrite }))
vi.mock('./insertArrays.js', () => ({ insertArrays: mocks.insertArrays }))

import { upsertRow } from './index.js'

const createTransformedWrite = (): RowToInsert => ({
  arrays: {},
  arraysToPush: {},
  blocks: {},
  blocksToDelete: new Set(),
  locales: { en: { slug: 'localized-slug' } },
  numbers: [],
  numbersToDelete: [],
  relationships: [],
  relationshipsToAppend: [],
  relationshipsToDelete: [],
  row: { _branch: 'feature' },
  selects: {},
  texts: [],
  textsToDelete: [],
})

describe('upsertRow localized branch data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should copy the parent branch into localized rows that use branch-scoped indexes', async () => {
    const db = {} as DrizzleAdapter['drizzle']
    const insert = vi.fn(({ tableName }: { tableName: string }) =>
      Promise.resolve(tableName === 'articles' ? [{ id: 1 }] : []),
    )
    const adapter = {
      insert,
      localesSuffix: '_locales',
      payload: { config: {} },
      rawTables: {
        articles_locales: {
          columns: { _branch: { name: '_branch', type: 'varchar' } },
        },
      },
      readReplicasAfterWriteInterval: 2000,
      relationshipsSuffix: '_rels',
      tables: {
        articles: { id: sql`id` },
        articles_locales: { _parentID: sql`parent_id` },
      },
      tableNameMap: new Map(),
    } as unknown as DrizzleAdapter

    mocks.transformForWrite.mockReturnValue(createTransformedWrite())

    await upsertRow({
      adapter,
      collectionSlug: 'articles',
      data: { _branch: 'feature', slug: 'localized-slug' },
      db,
      fields: [] as FlattenedField[],
      ignoreResult: true,
      operation: 'create',
      tableName: 'articles',
    })

    expect(insert).toHaveBeenCalledWith({
      db,
      tableName: 'articles_locales',
      values: [
        {
          _branch: 'feature',
          _locale: 'en',
          _parentID: 1,
          slug: 'localized-slug',
        },
      ],
    })
  })
})
