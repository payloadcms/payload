/* eslint-disable payload/no-relative-monorepo-imports -- Native private-file SQLite proof without Payload initialization. */
import type { Client } from '@libsql/client'
import type { PayloadRequest } from 'payload'

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { randomUUID } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SQLiteAdapter } from '../../../db-sqlite/src/types.js'
import type { DrizzleAdapter, TransactionSQLite } from '../types.js'

import { withReadTransaction } from '../../../db-sqlite/src/withReadTransaction.js'
import {
  captureBranchReadProjectionGuards,
  withBranchReadSnapshot,
} from '../../../payload/src/versions/branches/queries/withBranchReadSnapshot.js'
import {
  getBranchKey,
  getBranchStorageKey,
} from '../../../payload/src/versions/branches/storage/branchStorage.js'
import { getTransaction } from '../utilities/getTransaction.js'
import { createDrizzleBranchingAdapter } from './createDrizzleBranchingAdapter.js'
import { readProjectionStates } from './readProjectionStates.js'

const buildTable = ({ name }: { name: string }) =>
  sqliteTable(name, {
    id: integer().primaryKey(),
    rowKey: text().notNull().unique(),
    branchKey: text().notNull(),
    scopeKey: text().notNull(),
    generation: integer().notNull(),
    isInitialized: integer({ mode: 'boolean' }).notNull(),
    pendingCount: integer().notNull(),
  })
const articleStates = buildTable({ name: 'custom_article_states' })
const globalStates = buildTable({ name: 'custom_global_states' })
const schema = { articleStates, globalStates }
const scopes = [
  { rowKey: 'draft-shared', scopeKey: 'shared' },
  { rowKey: 'draft-en', scopeKey: 'locale:en' },
]

describe('SQLite batched projection readiness', () => {
  let client: Client
  let path: string
  let adapter: SQLiteAdapter

  beforeEach(async () => {
    path = join(tmpdir(), `payload-batch-readiness-${randomUUID()}.db`)
    client = createClient({ url: `file:${path}` })
    const db = drizzle(client, { schema })

    for (const table of ['custom_article_states', 'custom_global_states']) {
      await client.execute(
        `CREATE TABLE ${table} (id INTEGER PRIMARY KEY, rowKey TEXT UNIQUE NOT NULL, branchKey TEXT NOT NULL, scopeKey TEXT NOT NULL, generation INTEGER NOT NULL, isInitialized INTEGER NOT NULL, pendingCount INTEGER NOT NULL)`,
      )
      await client.execute(
        `INSERT INTO ${table} VALUES (1, 'draft-shared', 'drafts', 'shared', 3, 1, 0), (2, 'draft-en', 'drafts', 'locale:en', 4, 0, 2), (3, 'main-shared', 'main', 'shared', 9, 1, 0)`,
      )
    }
    adapter = {
      name: 'sqlite',
      client,
      drizzle: db,
      logger: false,
      schema,
      tables: { custom_article_states: articleStates, custom_global_states: globalStates },
      tableNameMap: new Map([
        ['article_states', 'custom_article_states'],
        ['global_states', 'custom_global_states'],
      ]),
      payload: {
        collections: {
          articles: { config: { custom: { branchQueryStorage: { states: 'article-states' } } } },
        },
        globals: { config: [{ custom: { branchQueryStorage: { states: 'global-states' } } }] },
      },
    } as unknown as SQLiteAdapter
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    client.close()
    await Promise.all([path, `${path}-wal`, `${path}-shm`].map((path) => rm(path, { force: true })))
  })

  it('should bind collection and global readiness to one native statement on the owned read session', async () => {
    const parentExecute = vi
      .spyOn(client, 'execute')
      .mockRejectedValue(new Error('Parent connection'))

    await withReadTransaction({
      adapter,
      read: async ({ db }) => {
        const nativeExecute = vi.spyOn((db as unknown as { $client: Client }).$client, 'execute')
        const rows = await readProjectionStates({
          adapter: adapter as unknown as DrizzleAdapter,
          db: db as TransactionSQLite,
          reads: ['article-states', 'global-states'].map((collection) => ({
            branchKey: 'drafts',
            collection,
            scopes,
          })),
        })

        expect(nativeExecute).toHaveBeenCalledTimes(1)
        expect(rows).toEqual(
          ['article-states', 'global-states'].flatMap((collection) => [
            {
              collection,
              id: 2,
              rowKey: 'draft-en',
              branchKey: 'drafts',
              scopeKey: 'locale:en',
              generation: 4,
              isInitialized: false,
              pendingCount: 2,
            },
            {
              collection,
              id: 1,
              rowKey: 'draft-shared',
              branchKey: 'drafts',
              scopeKey: 'shared',
              generation: 3,
              isInitialized: true,
              pendingCount: 0,
            },
          ]),
        )
      },
    })
    expect(parentExecute).not.toHaveBeenCalled()
  })

  it('should reject unregistered native tables and non-SQLite adapters before executing', async () => {
    const read = (collection: string, nativeAdapter = adapter) =>
      withReadTransaction({
        adapter,
        read: ({ db }) =>
          readProjectionStates({
            adapter: nativeAdapter as unknown as DrizzleAdapter,
            db: db as TransactionSQLite,
            reads: [{ branchKey: 'drafts', collection, scopes }],
          }),
      })

    await expect(read('custom_article_states')).rejects.toThrow(
      'Unknown branch projection readiness relation',
    )
    await expect(
      read('article-states', { ...adapter, name: 'postgres' } as unknown as SQLiteAdapter),
    ).rejects.toThrow('require a SQLite snapshot')
  })

  it.each([1, 160])(
    'should split readiness inventories with %i scopes per read under native compound and binding limits in one snapshot',
    async (scopesPerRead) => {
      await client.execute('PRAGMA journal_mode = WAL')
      const writer = createClient({ url: `file:${path}` })
      const reads = Array.from({ length: 70 }, () => ({
        branchKey: 'drafts',
        collection: 'article-states',
        scopes: Array.from({ length: scopesPerRead }, (_, index) => ({
          rowKey: `absent-${index}`,
          scopeKey: `locale:${index}`,
        })),
      }))

      reads[0]!.scopes.unshift(scopes[0]!)
      reads[69]!.scopes.unshift(scopes[0]!)
      try {
        await withReadTransaction({
          adapter,
          read: async ({ db }) => {
            const native = (db as unknown as { $client: Client }).$client
            const execute = native.execute.bind(native)
            let calls = 0

            vi.spyOn(native, 'execute').mockImplementation(async (statement) => {
              expect(typeof statement).toBe('object')
              if (typeof statement !== 'string') {
                expect(Object.values(statement.args ?? {}).length).toBeLessThanOrEqual(900)
                expect(statement.sql.match(/\bselect\b/gi)!.length).toBeLessThanOrEqual(50)
              }
              const result = await execute(statement)

              calls++
              if (calls === 1) {
                await writer.execute(
                  'UPDATE custom_article_states SET generation = 99 WHERE id = 1',
                )
              }
              return result
            })
            const rows = await readProjectionStates({
              adapter: adapter as unknown as DrizzleAdapter,
              db: db as TransactionSQLite,
              reads,
            })

            expect(calls).toBeGreaterThan(1)
            expect(rows).toHaveLength(2)
            expect(rows.every(({ generation }) => generation === 3)).toBe(true)
          },
        })
        expect(
          (await writer.execute('SELECT generation FROM custom_article_states WHERE id = 1'))
            .rows[0]!.generation,
        ).toBe(99)
      } finally {
        writer.close()
      }
    },
  )

  it('should keep batched readiness and subsequent guarded native reads coherent while a WAL writer commits', async () => {
    await client.execute('PRAGMA journal_mode = WAL')
    await client.execute('UPDATE custom_article_states SET isInitialized = 1, pendingCount = 0')
    await client.execute('UPDATE custom_global_states SET isInitialized = 1, pendingCount = 0')
    const writer = createClient({ url: `file:${path}` })
    const branchKey = getBranchKey({ branchID: 'drafts' })

    for (const table of ['custom_article_states', 'custom_global_states']) {
      for (const [id, scopeKey] of [
        [1, 'shared'],
        [2, 'locale:en'],
      ] as const) {
        await client.execute({
          sql: `UPDATE ${table} SET branchKey = ?, rowKey = ? WHERE id = ?`,
          args: [branchKey, getBranchStorageKey({ coordinates: [branchKey, scopeKey] }), id],
        })
      }
    }
    Object.assign(adapter, {
      sessions: {},
      find: async function (this: DrizzleAdapter, { req }: { req: PayloadRequest }) {
        const db = await getTransaction(this, req)

        return { docs: await (db as TransactionSQLite).select().from(articleStates) }
      },
    })
    adapter.payload.db = adapter
    adapter.branching = createDrizzleBranchingAdapter({
      adapter: adapter as unknown as DrizzleAdapter,
      isTransactionConfigured: true,
      withReadTransaction: ({ read }) => withReadTransaction({ adapter, read }),
    })
    const req = { context: {}, payload: adapter.payload } as PayloadRequest
    const controls = [
      { states: 'article-states', invalidations: 'article-invalidations' },
      { states: 'global-states', invalidations: 'global-invalidations' },
    ]

    try {
      await withBranchReadSnapshot({
        req,
        read: async ({ req }) => {
          const guards = await captureBranchReadProjectionGuards({
            branchID: 'drafts',
            controls,
            req,
            scopes: [{ type: 'shared' }, { type: 'locale', locale: 'en' }],
          })

          expect(
            guards.map(({ observations }) =>
              observations.map(({ generation }) => generation).sort(),
            ),
          ).toEqual([
            [3, 4],
            [3, 4],
          ])
          await writer.execute(
            'UPDATE custom_article_states SET generation = 99, pendingCount = 1 WHERE id = 1',
          )
          const result = await req.payload.db.find({ collection: 'article-states', req })

          expect(result.docs.find(({ id }) => id === 1)).toMatchObject({
            generation: 3,
            pendingCount: 0,
          })
          expect(
            await captureBranchReadProjectionGuards({
              branchID: 'drafts',
              controls,
              req,
              scopes: [{ type: 'shared' }],
            }),
          ).toEqual(guards)
        },
      })
      expect(
        (
          await writer.execute(
            'SELECT generation, pendingCount FROM custom_article_states WHERE id = 1',
          )
        ).rows[0],
      ).toMatchObject({ generation: 99, pendingCount: 1 })
    } finally {
      writer.close()
    }
  })
})
