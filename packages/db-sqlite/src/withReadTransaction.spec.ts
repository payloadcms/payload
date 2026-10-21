/* eslint-disable payload/no-relative-monorepo-imports -- Exercise native read sessions without initializing Payload. */
import type { Client, Transaction } from '@libsql/client'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { Payload, PayloadRequest } from 'payload'

import { createClient } from '@libsql/client'
import { eq, relations, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { randomUUID } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter } from '../../drizzle/src/types.js'
import type { SQLiteAdapter } from './types.js'

import { createDrizzleBranchingAdapter } from '../../drizzle/src/branching/createDrizzleBranchingAdapter.js'
import { getTransaction } from '../../drizzle/src/utilities/getTransaction.js'
import { configureReadConnections, retireReadConnections } from './readConnection.js'
import { withReadTransaction } from './withReadTransaction.js'

const records = sqliteTable('records', { id: integer().primaryKey(), title: text() })
const notes = sqliteTable('notes', {
  id: integer().primaryKey(),
  recordID: integer(),
  body: text(),
})
const recordsRelations = relations(records, ({ many }) => ({ notes: many(notes) }))
const notesRelations = relations(notes, ({ one }) => ({
  record: one(records, { fields: [notes.recordID], references: [records.id] }),
}))
const schema = { records, notes, recordsRelations, notesRelations }

describe('native SQLite branch read transactions', () => {
  let client: Client
  let path: string
  let adapter: SQLiteAdapter
  let req: PayloadRequest

  beforeEach(async () => {
    path = join(tmpdir(), `payload-read-snapshot-${randomUUID()}.db`)
    client = createClient({ url: `file:${path}` })
    await client.executeMultiple(
      "CREATE TABLE records (id INTEGER PRIMARY KEY, title TEXT); INSERT INTO records VALUES (1, 'before'); CREATE TABLE notes (id INTEGER PRIMARY KEY, recordID INTEGER, body TEXT); INSERT INTO notes VALUES (1, 1, 'note')",
    )
    adapter = {
      name: 'sqlite',
      client,
      drizzle: drizzle(client, { schema }),
      schema,
      sessions: {},
      logger: false,
      find: async function (this: DrizzleAdapter, { req }: { req: PayloadRequest }) {
        const db = await getTransaction(this, req)

        return db.select().from(records)
      },
    } as unknown as SQLiteAdapter
    adapter.branching = createDrizzleBranchingAdapter({
      adapter: adapter as unknown as DrizzleAdapter,
      isTransactionConfigured: true,
      withReadTransaction: ({ read }) => withReadTransaction({ adapter, read }),
    })
    req = {
      context: {},
      payload: { db: adapter } as unknown as Payload,
    } as PayloadRequest
  })

  it('should reuse compiled relations while binding fresh raw, relational and batch queries to each native session', async () => {
    const connectedDB = adapter.drizzle
    const databases: LibSQLDatabase<typeof schema>[] = []
    const parentExecute = vi.spyOn(client, 'execute').mockRejectedValue(new Error('Parent query'))

    for (let round = 0; round < 2; round++) {
      await withReadTransaction({
        adapter,
        read: async ({ db: scopedDB }) => {
          const db = scopedDB as unknown as LibSQLDatabase<typeof schema>

          databases.push(db)
          expect(db._.schema).toBe(connectedDB._.schema)
          expect(db._.fullSchema).toBe(connectedDB._.fullSchema)
          expect(db._.tableNamesMap).toBe(connectedDB._.tableNamesMap)
          expect(db.query.records).not.toBe(connectedDB.query.records)
          expect(await db.query.records.findFirst({ with: { notes: true } })).toEqual({
            id: 1,
            title: 'before',
            notes: [{ id: 1, recordID: 1, body: 'note' }],
          })
          expect(await db.get(sql`SELECT title FROM records WHERE id = 1`)).toEqual({
            title: 'before',
          })
          expect(
            await db.batch([db.select().from(records), db.all(sql`SELECT body FROM notes`)]),
          ).toEqual([[{ id: 1, title: 'before' }], [{ body: 'note' }]])
        },
      })
    }
    expect(databases[0]).not.toBe(databases[1])
    expect(databases[0]!.query.records).not.toBe(databases[1]!.query.records)
    expect(parentExecute).not.toHaveBeenCalled()
  })

  it('should isolate overlapping native sessions while reusing their connected schema', async () => {
    await client.execute('PRAGMA journal_mode = WAL')
    const writer = createClient({ url: `file:${path}` })
    let releaseFirst!: () => void
    let hasReadFirst!: () => void
    const firstRead = new Promise<void>((resolve) => {
      hasReadFirst = resolve
    })
    const canFinishFirst = new Promise<void>((resolve) => {
      releaseFirst = resolve
    })
    let firstDB: LibSQLDatabase<typeof schema> | undefined
    const first = withReadTransaction({
      adapter,
      read: async ({ db: scopedDB }) => {
        firstDB = scopedDB as unknown as LibSQLDatabase<typeof schema>
        expect(await firstDB.query.records.findFirst()).toEqual({ id: 1, title: 'before' })
        hasReadFirst()
        await canFinishFirst
        expect(await firstDB.query.records.findFirst()).toEqual({ id: 1, title: 'before' })
      },
    })

    try {
      await firstRead
      await writer.execute("UPDATE records SET title = 'after' WHERE id = 1")
      await withReadTransaction({
        adapter,
        read: async ({ db: scopedDB }) => {
          const secondDB = scopedDB as unknown as LibSQLDatabase<typeof schema>

          expect(secondDB).not.toBe(firstDB)
          expect(secondDB._.schema).toBe(firstDB!._.schema)
          expect(await secondDB.query.records.findFirst()).toEqual({ id: 1, title: 'after' })
          expect(await firstDB!.get(sql`SELECT title FROM records WHERE id = 1`)).toEqual({
            title: 'before',
          })
        },
      })
    } finally {
      releaseFirst()
      await first
      writer.close()
    }
  })

  it('should use rebuilt connected metadata after the adapter schema changes', async () => {
    const previousSchema = adapter.drizzle._.schema
    const rebuiltRecords = sqliteTable('records', { id: integer().primaryKey(), title: text() })
    const rebuiltSchema = { records: rebuiltRecords }

    adapter.schema = rebuiltSchema
    adapter.drizzle = drizzle(client, { schema: rebuiltSchema })
    await withReadTransaction({
      adapter,
      read: async ({ db: scopedDB }) => {
        const db = scopedDB as unknown as LibSQLDatabase<typeof rebuiltSchema>

        expect(db._.schema).not.toBe(previousSchema)
        expect(db._.schema).toBe(adapter.drizzle._.schema)
        expect(db._.fullSchema).toBe(rebuiltSchema)
        expect(await db.query.records.findFirst()).toEqual({ id: 1, title: 'before' })
      },
    })
  })

  afterEach(async () => {
    retireReadConnections({ adapter })
    vi.restoreAllMocks()
    client.close()
    await Promise.all([path, `${path}-wal`, `${path}-shm`].map((path) => rm(path, { force: true })))
  })

  it('should complete repeated snapshots after native parent queries and EXPLAIN without reserving a write transaction', async () => {
    const transaction = vi.spyOn(client, 'transaction')
    let captured: PayloadRequest | undefined

    for (let round = 0; round < 3; round++) {
      await client.execute('SELECT * FROM records ORDER BY id LIMIT 20')
      await client.execute('EXPLAIN QUERY PLAN SELECT * FROM records ORDER BY id LIMIT 20')
      const result = await adapter.branching!.withReadSnapshot!({
        req,
        read: async ({ req }) => {
          captured = req
          return req.payload.db.find({ collection: 'records', req })
        },
      })

      expect(result).toEqual([{ id: 1, title: 'before' }])
    }
    expect(transaction.mock.calls).toEqual([['read'], ['read'], ['read']])
    expect(() => captured!.payload.db.find({ collection: 'records', req: captured! })).toThrowError(
      expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }),
    )
    expect(adapter.sessions).toEqual({})
  })

  it('should keep all scoped reads in one snapshot while a separate WAL writer commits', async () => {
    await client.execute('PRAGMA journal_mode = WAL')
    const writer = createClient({ url: `file:${path}` })

    try {
      await adapter.branching!.withReadSnapshot!({
        req,
        read: async ({ req }) => {
          expect(await req.payload.db.find({ collection: 'records', req })).toEqual([
            { id: 1, title: 'before' },
          ])
          await writer.execute("UPDATE records SET title = 'after' WHERE id = 1")
          expect(await req.payload.db.find({ collection: 'records', req })).toEqual([
            { id: 1, title: 'before' },
          ])
        },
      })
      expect((await writer.execute('SELECT title FROM records')).rows[0]?.title).toBe('after')
    } finally {
      writer.close()
    }
  })

  for (const failure of ['callback', 'commit']) {
    it(`should roll back and close the native session after a ${failure} failure`, async () => {
      const original = client.transaction.bind(client)
      let transaction: Transaction | undefined
      const error = new Error(`Expected ${failure} failure`)

      vi.spyOn(client, 'transaction').mockImplementation(async (mode) => {
        transaction = await original(mode)
        vi.spyOn(transaction, 'rollback')
        vi.spyOn(transaction, 'close')
        if (failure === 'commit') {
          vi.spyOn(transaction, 'commit').mockRejectedValue(error)
        }
        return transaction
      })
      await expect(
        adapter.branching!.withReadSnapshot!({
          req,
          read: async ({ req }) => {
            await req.payload.db.find({ collection: 'records', req })
            if (failure === 'callback') {
              throw error
            }
          },
        }),
      ).rejects.toBe(error)
      expect(transaction!.rollback).toHaveBeenCalledOnce()
      expect(transaction!.close).toHaveBeenCalledOnce()
      expect(transaction!.closed).toBe(true)
      await client.execute("UPDATE records SET title = 'after' WHERE id = 1")
    })
  }

  for (const failure of [
    { primary: 'callback', shouldFailRollback: true, shouldFailClose: false },
    { primary: 'callback', shouldFailRollback: false, shouldFailClose: true },
    { primary: 'commit', shouldFailRollback: true, shouldFailClose: true },
    { primary: undefined, shouldFailRollback: false, shouldFailClose: true },
  ]) {
    it(`should preserve ${failure.primary ?? 'close'} error identity when cleanup fails with rollback=${failure.shouldFailRollback} and close=${failure.shouldFailClose}`, async () => {
      const original = client.transaction.bind(client)
      const primaryError = new Error(`Expected ${failure.primary} failure`)
      const rollbackError = new Error('Expected rollback failure')
      const closeError = new Error('Expected close failure')
      let transaction: Transaction | undefined
      let captured: PayloadRequest | undefined

      vi.spyOn(client, 'transaction').mockImplementation(async (mode) => {
        transaction = await original(mode)
        const close = transaction.close.bind(transaction)

        vi.spyOn(transaction, 'close').mockImplementation(() => {
          close()
          if (failure.shouldFailClose) {
            throw closeError
          }
        })
        const rollback = vi.spyOn(transaction, 'rollback')

        if (failure.shouldFailRollback) {
          rollback.mockRejectedValue(rollbackError)
        }
        if (failure.primary === 'commit') {
          vi.spyOn(transaction, 'commit').mockRejectedValue(primaryError)
        }
        return transaction
      })
      await expect(
        adapter.branching!.withReadSnapshot!({
          req,
          read: async ({ req }) => {
            captured = req
            await req.payload.db.find({ collection: 'records', req })
            if (failure.primary === 'callback') {
              throw primaryError
            }
          },
        }),
      ).rejects.toBe(failure.primary ? primaryError : closeError)
      expect(transaction!.rollback).toHaveBeenCalledTimes(failure.primary ? 1 : 0)
      expect(transaction!.close).toHaveBeenCalledOnce()
      expect(transaction!.closed).toBe(true)
      expect(() => captured!.payload).toThrowError(
        expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }),
      )
      await client.execute("UPDATE records SET title = 'after' WHERE id = 1")
    })
  }

  it('should leave an existing caller transaction writable and owned by its caller', async () => {
    await adapter.drizzle.transaction(async (transaction) => {
      adapter.sessions.caller = { db: transaction } as never
      req.transactionID = 'caller'
      const begin = vi.spyOn(client, 'transaction')

      try {
        await adapter.branching!.withReadSnapshot!({
          req,
          read: async ({ req }) => {
            expect(await req.payload.db.find({ collection: 'records', req })).toEqual([
              { id: 1, title: 'before' },
            ])
          },
        })
        expect(begin).not.toHaveBeenCalled()
        await transaction.update(records).set({ title: 'after' }).where(eq(records.id, 1))
      } finally {
        delete adapter.sessions.caller
      }
    })
    expect((await client.execute('SELECT title FROM records')).rows[0]?.title).toBe('after')
  })

  it('should couple the pooled native connection to expiring real branch read scopes', async () => {
    adapter.clientConfig = { url: `file:${path}` }
    adapter.busyTimeout = 0
    await configureReadConnections({ adapter })
    const begin = vi.spyOn(client, 'transaction')
    let readLater: (() => Promise<unknown>) | undefined

    for (let round = 0; round < 2; round++) {
      await adapter.branching!.withReadSnapshot!({
        req,
        read: async ({ req: scoped }) => {
          readLater = () => scoped.payload.db.find({ collection: 'records', req: scoped })
          expect(await readLater()).toEqual([{ id: 1, title: 'before' }])
        },
      })
      expect(readLater).toThrowError(
        expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }),
      )
    }
    expect(begin).not.toHaveBeenCalled()
    await client.execute("UPDATE records SET title = 'after'")
    expect((await client.execute('SELECT title FROM records')).rows[0]?.title).toBe('after')
  })
})
