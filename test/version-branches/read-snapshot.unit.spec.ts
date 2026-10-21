/* eslint-disable payload/no-relative-monorepo-imports -- Verify native internal snapshots without initializing a Payload fixture. */
import type { SQL } from 'drizzle-orm'
import type { AnyD1Database } from 'drizzle-orm/d1'
import type { PayloadRequest } from 'payload'

import { eq, sql } from 'drizzle-orm'
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres'
import { integer as pgInteger, pgTable, text as pgText } from 'drizzle-orm/pg-core'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import mongoose from 'mongoose'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { BasePayload, buildConfig } from 'payload'
import { Pool } from 'pg'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import type { SQLiteD1Adapter } from '../../packages/db-d1-sqlite/src/types.js'
import type { MongooseAdapter } from '../../packages/db-mongodb/src/index.js'
import type { DrizzleAdapter, TransactionPg } from '../../packages/drizzle/src/types.js'

import { createBranchReadTrace } from '../../packages/db-d1-sqlite/src/branchReadTrace.js'
import { createReadSnapshot as createD1ReadSnapshot } from '../../packages/db-d1-sqlite/src/createReadSnapshot.js'
import { createReadSnapshot as createMongoReadSnapshot } from '../../packages/db-mongodb/src/branching/createReadSnapshot.js'
import { beginTransaction as beginMongoTransaction } from '../../packages/db-mongodb/src/transactions/beginTransaction.js'
import { getSession } from '../../packages/db-mongodb/src/utilities/getSession.js'
import { createReadSnapshot as createSQLReadSnapshot } from '../../packages/drizzle/src/branching/createReadSnapshot.js'
import { find } from '../../packages/drizzle/src/find.js'
import { operatorMap } from '../../packages/drizzle/src/queries/operatorMap.js'
import { countDistinct } from '../../packages/drizzle/src/sqlite/countDistinct.js'
import { getTransaction } from '../../packages/drizzle/src/utilities/getTransaction.js'
import { queryBranchContentGraph } from '../../packages/payload/src/versions/branches/queries/queryBranchContentGraph.js'
import {
  captureBranchReadProjectionGuard,
  withBranchReadSnapshot,
} from '../../packages/payload/src/versions/branches/queries/withBranchReadSnapshot.js'

const require = createRequire(import.meta.url)
const sqlSnapshot = ({ adapter }: { adapter: DrizzleAdapter }) => {
  adapter.find = async function ({ req, nativeRead }) {
    return nativeRead(await getTransaction(this, req))
  } as never
  return createSQLReadSnapshot({ adapter })
}
const nativeSQL = ({
  req,
  read,
}: {
  read: (db: TransactionPg) => Promise<unknown>
  req: PayloadRequest
}) => req.payload.db.find({ req, nativeRead: read } as never) as unknown as Promise<any>
const mongoSnapshot = ({ adapter }: { adapter: MongooseAdapter }) => {
  adapter.findOne = async function ({ req }) {
    return this.connection.db
      .collection('related')
      .findOne({ id: 1 }, { session: await getSession(this, req) })
  } as never
  return createMongoReadSnapshot({ adapter, isTransactionsEnabled: true })
}
const isNativeEnabled = process.env.BRANCH_READ_SNAPSHOT_NATIVE === 'true'

describe.skipIf(!isNativeEnabled)('native branch read snapshots', () => {
  const table = `branch_read_${randomUUID().replaceAll('-', '')}`
  const pool = new Pool({ connectionString: process.env.POSTGRES_URL })
  let mongo: mongoose.Connection
  let miniflare: {
    dispose: () => Promise<void>
    getD1Database: (name: string) => Promise<AnyD1Database>
  }
  let binding: AnyD1Database

  beforeAll(async () => {
    const { Miniflare } = await import(
      require.resolve('miniflare', { paths: [require.resolve('wrangler/package.json')] })
    )

    miniflare = new Miniflare({
      d1Databases: ['DB'],
      modules: true,
      script: 'export default { fetch() { return new Response("ok") } }',
    })
    binding = await miniflare.getD1Database('DB')
    await binding.exec(
      "CREATE TABLE related (id INTEGER PRIMARY KEY, title TEXT); INSERT INTO related VALUES (1, 'old')",
    )
    await pool.query(`CREATE TABLE ${table} (id integer primary key, title text)`)
    await pool.query(`INSERT INTO ${table} VALUES (1, 'old')`)
    mongo = await mongoose
      .createConnection(process.env.MONGODB_URL!, { dbName: table, monitorCommands: true })
      .asPromise()
    await mongo.db!.collection('related').insertOne({ id: 1, title: 'old' })
  }, 60_000)

  afterAll(async () => {
    if (mongo) {
      await mongo.dropDatabase()
      await mongo.close()
    }
    await pool.query(`DROP TABLE IF EXISTS ${table}`)
    await pool.end()
    await miniflare?.dispose()
  })

  it('should retain PostgreSQL related content across an intervening committed update', async () => {
    const adapter = {
      drizzle: pgDrizzle(pool),
      name: 'postgres',
      sessions: {},
    } as unknown as DrizzleAdapter
    const req = { payload: { db: adapter } } as unknown as PayloadRequest
    const read = sqlSnapshot({ adapter })

    const titles = await read({
      read: async ({ req }) => {
        const db = { execute: (query: SQL) => nativeSQL({ req, read: (db) => db.execute(query) }) }
        const first = await db.execute(sql.raw(`SELECT title FROM ${table}`))

        await pool.query(`UPDATE ${table} SET title = 'new'`)
        const second = await db.execute(sql.raw(`SELECT title FROM ${table}`))

        return [first.rows[0].title, second.rows[0].title]
      },
      req,
    })

    expect(titles).toEqual(['old', 'old'])
    expect((await pool.query(`SELECT title FROM ${table}`)).rows[0].title).toBe('new')
    expect(adapter.sessions).toEqual({})
    expect(req.transactionID).toBeUndefined()
  })

  it('should support caller PostgreSQL read committed with read-your-writes and typed ordered rows', async () => {
    const db = pgDrizzle(pool)
    const relation = pgTable(table, { id: pgInteger('id'), title: pgText('title') })

    await db.transaction(async (tx) => {
      await tx.execute(sql.raw(`UPDATE ${table} SET title = 'caller'`))
      const adapter = {
        drizzle: db,
        name: 'postgres',
        schema: {},
        sessions: { caller: { db: tx } },
      } as unknown as DrizzleAdapter
      const req = { payload: { db: adapter }, transactionID: 'caller' } as unknown as PayloadRequest
      const read = vi.fn(async ({ req }) => {
        const scoped = {
          execute: (query: SQL) => nativeSQL({ req, read: (db) => db.execute(query) }),
        }
        const first = await scoped.execute(
          sql`SELECT title FROM ${sql.identifier(table)} WHERE id = ${1}`,
        )
        const typed = await scoped.execute(
          sql`SELECT ${'9007199254740993'}::bigint AS integer, ${'1.2500'}::numeric AS decimal, ${'2026-10-21T12:00:00Z'}::timestamptz AS date, ${JSON.stringify({ deep: [1, null, 'x'] })}::jsonb AS body, '\x6162'::bytea AS bytes, '$1' AS literal, $$ $1 $$ AS dollar`,
        )
        const missing = await scoped.execute(
          sql`SELECT title FROM ${sql.identifier(table)} WHERE id = ${2}`,
        )

        const positional = await nativeSQL({
          req,
          read: (db) =>
            db
              .select({ id: relation.id, title: relation.title })
              .from(relation)
              .where(eq(relation.id, 1)),
        })

        const wide = await scoped.execute(
          sql`SELECT ${sql.join(
            Array.from(
              { length: 120 },
              (_, index) => sql`${index}::integer AS ${sql.identifier(`field${index}`)}`,
            ),
            sql`, `,
          )}`,
        )

        expect(wide.rows[0].field119).toBe(119)
        expect(positional).toEqual([{ id: 1, title: 'caller' }])
        expect(first.rows).toEqual([{ title: 'caller' }])
        expect(missing.rows).toEqual([])
        return typed.rows
      })
      const result = await sqlSnapshot({ adapter })({ read, req })

      expect(result[0]).toMatchObject({
        integer: '9007199254740993',
        decimal: '1.2500',
        body: { deep: [1, null, 'x'] },
        literal: '$1',
        dollar: ' $1 ',
      })
      expect(read).toHaveBeenCalledTimes(1)
      expect(req.transactionID).toBe('caller')
      expect(
        (await tx.execute(sql`SELECT current_setting('transaction_isolation') AS isolation`)).rows,
      ).toEqual([{ isolation: 'read committed' }])
    })
  })

  it('should reject a mixed PostgreSQL read committed graph without replaying callback effects', async () => {
    await pool.query(`UPDATE ${table} SET title = 'before'`)
    const db = pgDrizzle(pool)

    await db.transaction(async (tx) => {
      const adapter = {
        drizzle: db,
        name: 'postgres',
        schema: {},
        sessions: { caller: { db: tx } },
      } as unknown as DrizzleAdapter
      const req = { payload: { db: adapter }, transactionID: 'caller' } as unknown as PayloadRequest
      const read = vi.fn(async ({ req }) => {
        const scoped = {
          execute: (query: SQL) => nativeSQL({ req, read: (db) => db.execute(query) }),
        }
        const first = await scoped.execute(sql`SELECT title FROM ${sql.identifier(table)}`)

        await pool.query(`UPDATE ${table} SET title = 'after'`)
        const second = await scoped.execute(sql`SELECT title FROM ${sql.identifier(table)}`)

        return [first.rows, second.rows]
      })

      await expect(sqlSnapshot({ adapter })({ read, req })).rejects.toMatchObject({
        code: 'branch-projection-conflict',
      })
      expect(read).toHaveBeenCalledTimes(1)
      expect((await tx.execute(sql`SELECT 1 AS active`)).rows).toEqual([{ active: 1 }])
    })
  })

  it('should pin MongoDB related reads to a wire-proven snapshot session without a commit round trip', async () => {
    const adapter = {
      connection: mongo,
      sessions: {},
      payload: {
        collections: {
          anchor: { config: { custom: { branchQueryStorage: { states: 'anchor' } } } },
        },
      },
      collections: { anchor: { collection: { name: 'related' } } },
    } as unknown as MongooseAdapter
    const req = { payload: { db: adapter } } as unknown as PayloadRequest
    const read = mongoSnapshot({ adapter })
    type Command = {
      commitTransaction?: unknown
      find?: string
      readConcern?: { atClusterTime?: unknown; level?: string }
    }
    const commands: Command[] = []
    const listener = (event: { command: Command }) => commands.push(event.command)
    mongo.getClient().on('commandStarted', listener)
    const titles = await read({
      read: async ({ req }) => {
        const first = await req.payload.db.findOne({ collection: 'related', req })

        await mongo.db!.collection('related').updateOne({ id: 1 }, { $set: { title: 'new' } })
        const second = await req.payload.db.findOne({ collection: 'related', req })

        return [first!.title, second!.title]
      },
      req,
    })

    mongo.getClient().off('commandStarted', listener)
    expect(titles).toEqual(['old', 'old'])
    const finds = commands.filter((command) => command.find === 'related')
    expect(finds[0]?.readConcern?.level).toBe('snapshot')
    expect(finds[1]?.readConcern?.atClusterTime).toBeDefined()
    expect(commands.some((command) => command.commitTransaction)).toBe(false)
    expect(adapter.sessions).toEqual({})
  })

  it('should pin the owned Mongo snapshot before a callback launches parallel first reads', async () => {
    await mongo
      .db!.collection('related')
      .updateOne({ id: 1 }, { $set: { title: 'before-parallel' } })
    const adapter = {
      connection: mongo,
      sessions: {},
      payload: {
        collections: {
          anchor: { config: { custom: { branchQueryStorage: { states: 'anchor' } } } },
        },
      },
      collections: { anchor: { collection: { name: 'related' } } },
    } as unknown as MongooseAdapter
    const req = { payload: { db: adapter } } as unknown as PayloadRequest
    const values = await mongoSnapshot({ adapter })({
      req,
      read: async ({ req }) => {
        await mongo
          .db!.collection('related')
          .updateOne({ id: 1 }, { $set: { title: 'after-anchor' } })
        return Promise.all(
          [1, 2].map(
            async () => (await req.payload.db.findOne({ collection: 'related', req }))!.title,
          ),
        )
      },
    })
    expect(values).toEqual(['before-parallel', 'before-parallel'])
  })

  it('should use native Payload default MongoDB caller transactions without explicit concern configuration', async () => {
    const adapter = {
      connection: mongo,
      sessions: {},
      transactionOptions: {},
      payload: {
        collections: {
          related: {
            config: { custom: { branchQueryStorage: { projection: 'related-projection' } } },
          },
        },
        logger: { warn: vi.fn() },
      },
    } as unknown as MongooseAdapter
    adapter.beginTransaction = beginMongoTransaction
    const transactionID = await adapter.beginTransaction()
    const session = adapter.sessions[transactionID!]
    const req = { payload: { db: adapter }, transactionID } as unknown as PayloadRequest

    try {
      await mongo
        .db!.collection('related')
        .updateOne({ id: 1 }, { $set: { title: 'caller' } }, { session })
      const result = await mongoSnapshot({ adapter })({
        read: ({ req }) => req.payload.db.findOne({ collection: 'related', req }),
        req,
      })

      expect(result!.title).toBe('caller')
      expect(session.inTransaction()).toBe(true)
    } finally {
      await session.abortTransaction()
      await session.endSession()
    }
  })

  it('should retain initial readiness observations across reused guards and reject a later cache-generation change in caller read committed', async () => {
    await pool.query(`UPDATE ${table} SET title = '1'`)
    const db = pgDrizzle(pool)
    let emissions = 0
    let callbacks = 0
    await db.transaction(async (tx) => {
      const adapter = {
        drizzle: db,
        name: 'postgres',
        schema: {},
        sessions: { caller: { db: tx } },
      } as unknown as DrizzleAdapter
      const snapshot = createSQLReadSnapshot({ adapter })
      adapter.find = async function ({ req, collection }) {
        const native = await getTransaction(this, req)
        const result = await native.execute(
          sql`SELECT id, title::integer AS generation FROM ${sql.identifier(table)}`,
        )
        return {
          docs: result.rows.map((row) => ({
            ...row,
            isInitialized: true,
            pendingCount: 0,
            scopeKey: 'shared',
          })),
        }
      } as never
      adapter.branching = { withReadSnapshot: snapshot } as never
      const req = { payload: { db: adapter }, transactionID: 'caller' } as unknown as PayloadRequest
      await expect(
        withBranchReadSnapshot({
          req,
          read: async ({ req }) => {
            callbacks++
            const capture = () =>
              captureBranchReadProjectionGuard({
                branchID: 'staging',
                control: { states: 'projection-states', invalidations: 'projection-invalidations' },
                scopes: [{ type: 'shared' }],
                req,
              })
            await capture()
            await pool.query(`UPDATE ${table} SET title = '2'`)
            await capture()
            return req.payload.db.find({ collection: 'projection-states', req })
          },
        }).then(() => {
          emissions++
        }),
      ).rejects.toMatchObject({ code: 'branch-projection-conflict' })
      expect(callbacks).toBe(1)
      expect(emissions).toBe(0)
    })
  })

  it('should return the old consistent cache generation in an owned fixed snapshot after a committed replacement', async () => {
    await pool.query(`UPDATE ${table} SET title = '1'`)
    const adapter = {
      drizzle: pgDrizzle(pool),
      name: 'postgres',
      sessions: {},
    } as unknown as DrizzleAdapter
    adapter.find = async function ({ req }) {
      const native = await getTransaction(this, req)
      const result = await native.execute(
        sql`SELECT id, title::integer AS generation FROM ${sql.identifier(table)}`,
      )
      return {
        docs: result.rows.map((row) => ({
          ...row,
          isInitialized: true,
          pendingCount: 0,
          scopeKey: 'shared',
        })),
      }
    } as never
    adapter.branching = { withReadSnapshot: createSQLReadSnapshot({ adapter }) } as never
    const req = { payload: { db: adapter } } as unknown as PayloadRequest
    const result = await withBranchReadSnapshot({
      req,
      read: async ({ req }) => {
        const args = {
          branchID: 'staging',
          control: { states: 'projection-states', invalidations: 'projection-invalidations' },
          scopes: [{ type: 'shared' as const }],
          req,
        }
        await captureBranchReadProjectionGuard(args)
        await pool.query(`UPDATE ${table} SET title = '2'`)
        await captureBranchReadProjectionGuard(args)
        return req.payload.db.find({ collection: 'projection-states', req })
      },
    })
    expect(result.docs[0].generation).toBe(1)
    expect((await pool.query(`SELECT title FROM ${table}`)).rows[0].title).toBe('2')
  })

  it('should revoke captured PostgreSQL read capabilities on success and failure without affecting the writable caller', async () => {
    const db = pgDrizzle(pool)
    await db.transaction(async (tx) => {
      const adapter = {
        drizzle: db,
        name: 'postgres',
        schema: {},
        sessions: { caller: { db: tx } },
      } as unknown as DrizzleAdapter
      const req = { payload: { db: adapter }, transactionID: 'caller' } as unknown as PayloadRequest
      let escaped: typeof adapter.find | undefined
      const read = sqlSnapshot({ adapter })
      await read({
        req,
        read: async ({ req }) => {
          escaped = req.payload.db.find
          expect(Object.getPrototypeOf(req.payload)).toBeNull()
          expect(Object.getPrototypeOf(req.payload.db)).toBeNull()
          expect(Object.getOwnPropertyDescriptor(req.payload.db, 'sessions')).toBeUndefined()
          expect(() => Reflect.get(req.payload.db.branching!, 'executeAtomicBatch')).toThrowError(
            expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }),
          )
          expect(() => Reflect.get(req.payload.db, 'drizzle')).toThrowError(
            expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }),
          )
          for (const method of ['create', 'updateOne', 'deleteMany']) {
            expect(() => Reflect.get(req.payload.db, method)).toThrowError(
              expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }),
            )
          }
          expect(
            (
              (await escaped!({
                nativeRead: (db) => db.execute(sql`SELECT 1 AS ready`),
              } as never)) as any
            ).rows,
          ).toEqual([{ ready: 1 }])
        },
      })
      await expect(
        escaped!({ nativeRead: (db) => db.execute(sql`SELECT 1 AS escaped`) } as never),
      ).rejects.toMatchObject({ code: 'branch-read-snapshot-unsupported' })
      await expect(
        read({
          req,
          read: ({ req }) => {
            escaped = req.payload.db.find
            return Promise.reject(new Error('callback failure'))
          },
        }),
      ).rejects.toThrow('callback failure')
      await expect(
        escaped!({ nativeRead: (db) => db.execute(sql`SELECT 1 AS escaped`) } as never),
      ).rejects.toMatchObject({ code: 'branch-read-snapshot-unsupported' })
      expect(
        (
          await tx.execute(
            sql`UPDATE ${sql.identifier(table)} SET title = 'caller-still-writable' RETURNING title`,
          )
        ).rows[0].title,
      ).toBe('caller-still-writable')
    })
  })

  it('should revoke owned Mongo read functions before an ended snapshot can fall through to an unscoped query', async () => {
    const adapter = {
      connection: mongo,
      sessions: {},
      payload: {
        collections: {
          anchor: { config: { custom: { branchQueryStorage: { states: 'anchor' } } } },
        },
      },
      collections: { anchor: { collection: { name: 'related' } } },
    } as unknown as MongooseAdapter
    const req = { payload: { db: adapter } } as unknown as PayloadRequest
    let escaped: typeof adapter.findOne | undefined
    const read = mongoSnapshot({ adapter })
    await read({
      req,
      read: async ({ req }) => {
        escaped = req.payload.db.findOne
        expect(await escaped!({ collection: 'related' })).not.toBeNull()
        expect(() => Reflect.get(req.payload.db, 'connection')).toThrowError(
          expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }),
        )
        expect(() => Reflect.get(req.payload.db, 'create')).toThrowError(
          expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }),
        )
      },
    })
    await expect(escaped!({ collection: 'related' })).rejects.toMatchObject({
      code: 'branch-read-snapshot-unsupported',
    })
    await expect(
      read({
        req,
        read: ({ req }) => {
          escaped = req.payload.db.findOne
          return Promise.reject(new Error('callback failure'))
        },
      }),
    ).rejects.toThrow('callback failure')
    await expect(escaped!({ collection: 'related' })).rejects.toMatchObject({
      code: 'branch-read-snapshot-unsupported',
    })
  })

  it('should reject MongoDB caller local concern without replaying callbacks', async () => {
    const session = mongo.getClient().startSession()

    session.startTransaction({ readConcern: { level: 'local' }, writeConcern: { w: 'majority' } })
    const adapter = {
      connection: mongo,
      sessions: { caller: session },
    } as unknown as MongooseAdapter
    const req = { payload: { db: adapter }, transactionID: 'caller' } as unknown as PayloadRequest
    const read = vi.fn(() => Promise.resolve('never'))

    try {
      await expect(
        createMongoReadSnapshot({ adapter, isTransactionsEnabled: true })({ read, req }),
      ).rejects.toMatchObject({ code: 'branch-read-snapshot-unsupported' })
      expect(read).not.toHaveBeenCalled()
    } finally {
      await session.abortTransaction()
      await session.endSession()
    }
  })

  it('should validate ordered D1 raw rows, negatives and totals in one actual binding batch', async () => {
    const trace = createBranchReadTrace({ binding })

    expect(await trace.binding.prepare('SELECT title, id FROM related ORDER BY id').raw()).toEqual([
      ['old', 1],
    ])
    expect(
      (await trace.binding.prepare('SELECT id FROM related WHERE id = ?').bind(2).all()).results,
    ).toEqual([])
    expect(
      (await trace.binding.prepare('SELECT count(*) AS total FROM related').all()).results,
    ).toEqual([{ total: 1 }])
    expect(
      await trace.binding
        .prepare('WITH selected AS MATERIALIZED (SELECT id FROM related) SELECT id FROM selected')
        .raw(),
    ).toEqual([[1]])
    await expect(trace.validate()).resolves.toBeUndefined()
  })

  it('should reject an ordinary D1 target change before publishing the collected graph', async () => {
    const trace = createBranchReadTrace({ binding })

    await trace.binding.prepare('SELECT title FROM related WHERE id = 1').all()
    await binding.prepare('UPDATE related SET title = ? WHERE id = 1').bind('new').run()
    await trace.binding.prepare('SELECT title FROM related WHERE id = 1').all()
    await expect(trace.validate()).rejects.toMatchObject({ code: 'branch-projection-conflict' })
  })

  it('should record native ordinary-target adapter reads using only the request-local session registry', async () => {
    const related = sqliteTable('related', { id: integer('id').primaryKey(), title: text('title') })
    const fields = [
      { name: 'id', type: 'number' },
      { name: 'title', type: 'text' },
    ]
    const adapter = {
      binding,
      countDistinct,
      find,
      idType: 'number',
      name: 'sqlite',
      operatorHandlers: [],
      operators: operatorMap,
      payload: {
        collections: {
          related: {
            config: {
              slug: 'related',
              defaultSort: 'id',
              fields,
              flattenedFields: fields,
              timestamps: false,
            },
          },
        },
        config: {},
      },
      schema: { related },
      sessions: {},
      tableNameMap: new Map([['related', 'related']]),
      tables: { related },
    } as unknown as SQLiteD1Adapter
    const req = { payload: { db: adapter } } as unknown as PayloadRequest

    await binding.prepare('UPDATE related SET title = ? WHERE id = 1').bind('old').run()
    const read = createD1ReadSnapshot({ adapter })

    const result = await read({
      read: async ({ req }) => {
        expect(await req.payload.db.branching!.capabilities({ req })).toMatchObject({
          interactiveTransactions: false,
        })
        const result = await req.payload.db.find({ collection: 'related', limit: 10, req })

        expect(result.docs).toEqual([{ id: 1, title: 'old' }])
        return result
      },
      req,
    })

    expect(result.docs).toEqual([{ id: 1, title: 'old' }])
    expect(adapter.sessions).toEqual({})
    expect(req.transactionID).toBeUndefined()
    await expect(
      read({
        read: async ({ req }) => {
          const result = await req.payload.db.find({ collection: 'related', limit: 10, req })

          await binding.prepare('UPDATE related SET title = ? WHERE id = 1').bind('new').run()
          return result
        },
        req,
      }),
    ).rejects.toMatchObject({ code: 'branch-projection-conflict' })
  })

  it('should freeze an automatic native D1 graph with allowed, denied and cyclic ordinary targets', async () => {
    await binding.exec(
      "ALTER TABLE related ADD COLUMN friend INTEGER; ALTER TABLE related ADD COLUMN blocked INTEGER; INSERT INTO related (id, title, friend) VALUES (2, 'allowed', 1), (3, 'denied', NULL); UPDATE related SET title = 'root', friend = 2, blocked = 3 WHERE id = 1",
    )
    const related = sqliteTable('related', {
      id: integer('id').primaryKey(),
      title: text('title'),
      friend: integer('friend'),
      blocked: integer('blocked'),
    })
    const fields = [
      { name: 'id', type: 'number' },
      { name: 'title', type: 'text' },
      { name: 'friend', type: 'relationship', relationTo: 'related' },
      { name: 'blocked', type: 'relationship', relationTo: 'related' },
    ]
    const config = {
      slug: 'related',
      access: { read: () => ({ title: { not_equals: 'denied' } }) },
      defaultSort: 'id',
      fields,
      flattenedFields: fields,
      timestamps: false,
      joins: {},
      polymorphicJoins: [],
    }
    const payload = {
      blocks: {},
      collections: { related: { config } },
      config: { blocks: [], localization: false },
    }
    const adapter = {
      binding,
      countDistinct,
      find,
      idType: 'number',
      name: 'sqlite',
      operatorHandlers: [],
      operators: operatorMap,
      payload,
      schema: { related },
      sessions: {},
      tableNameMap: new Map([['related', 'related']]),
      tables: { related },
    } as unknown as SQLiteD1Adapter

    adapter.branching = { withReadSnapshot: createD1ReadSnapshot({ adapter }) } as never
    const req = { payload: { ...payload, db: adapter } } as unknown as PayloadRequest
    const { graph, result } = await queryBranchContentGraph({
      branchID: 'drafts',
      collection: 'related',
      depth: 2,
      req,
      where: { id: { equals: 1 } },
    })

    expect(result.docs).toEqual([{ id: 1, title: 'root', friend: 2, blocked: 3 }])
    expect(graph.get({ collection: 'related', id: 2 })).toEqual({
      id: 2,
      title: 'allowed',
      friend: 1,
      blocked: null,
    })
    expect(graph.get({ collection: 'related', id: 3 })).toBeNull()
    await binding.prepare("UPDATE related SET title = 'later' WHERE id = 2").run()
    expect(graph.get({ collection: 'related', id: 2 })!.title).toBe('allowed')
    expect(() => graph.get({ collection: 'related', id: 4 })).toThrow()
  })

  it('should trace a captured real Payload Local API read inside an access callback without escaping the scoped binding', async () => {
    const payload = new BasePayload()
    let nestedAdapter: unknown
    const mutationHook = vi.fn()
    let copiedRequest: Partial<PayloadRequest>
    const unknownAccessor = vi.fn(function () {
      return this
    })
    Object.defineProperty(payload, 'unknownReadAccessor', { get: unknownAccessor })
    const nestedHook = vi.fn(({ doc }) => doc)
    const outerHook = vi.fn(({ doc }) => doc)
    const readAccess = vi.fn(async ({ req }) => {
      await expect(
        payload.create({ collection: 'policy-targets', data: { title: 'forbidden' }, req }),
      ).rejects.toMatchObject({ code: 'branch-read-snapshot-unsupported' })
      expect(() =>
        req.payload.create({ collection: 'policy-targets', data: { title: 'forbidden' } }),
      ).toThrowError(expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }))
      for (const method of [
        '__defineGetter__',
        '__defineSetter__',
        '__lookupGetter__',
        '__lookupSetter__',
      ]) {
        expect(() => Reflect.get(req.payload, method)).toThrowError(
          expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }),
        )
      }
      expect(() =>
        Object.prototype.__defineGetter__.call(req.payload, 'nativeLeak', function () {
          return this
        }),
      ).toThrowError(expect.objectContaining({ code: 'branch-read-snapshot-unsupported' }))
      expect(Object.getPrototypeOf(req.payload.valueOf())).toBeNull()
      copiedRequest = { ...req }
      for (const copied of [
        copiedRequest,
        { payload: req.payload, transactionID: req.transactionID },
      ]) {
        await expect(
          payload.find({ collection: 'policy-targets', req: copied }),
        ).rejects.toMatchObject({ code: 'branch-read-snapshot-unsupported' })
        await expect(
          payload.create({
            collection: 'policy-targets',
            data: { title: 'forbidden copy' },
            req: copied,
          }),
        ).rejects.toMatchObject({ code: 'branch-read-snapshot-unsupported' })
      }
      const result = await payload.find({
        collection: 'policy-targets',
        depth: 0,
        overrideAccess: false,
        req,
        where: { id: { equals: 1 } },
      })

      nestedAdapter = req.payload.db
      expect(result.docs[0].title).toBe('root')
      await binding.prepare("UPDATE related SET title = 'changed-during-policy' WHERE id = 1").run()
      return true
    })
    payload.config = await buildConfig({
      secret: 'snapshot-test-secret',
      collections: [
        {
          slug: 'related',
          access: { read: readAccess },
          hooks: { afterRead: [outerHook] },
          fields: [
            { name: 'id', type: 'number' },
            { name: 'title', type: 'text' },
          ],
          timestamps: false,
          versions: false,
        },
        {
          slug: 'policy-targets',
          access: { read: () => true },
          hooks: { afterRead: [nestedHook], beforeChange: [mutationHook] },
          fields: [
            { name: 'id', type: 'number' },
            { name: 'title', type: 'text' },
          ],
          timestamps: false,
          versions: false,
        },
      ],
      typescript: { autoGenerate: false },
    })
    payload.collections = Object.fromEntries(
      payload.config.collections.map((config) => [config.slug, { config }]),
    ) as never
    const related = sqliteTable('related', { id: integer('id').primaryKey(), title: text('title') })
    const adapter = {
      binding,
      countDistinct,
      find,
      idType: 'number',
      name: 'sqlite',
      operatorHandlers: [],
      operators: operatorMap,
      payload,
      schema: { related },
      sessions: {},
      tableNameMap: new Map([
        ['policy_targets', 'related'],
        ['related', 'related'],
      ]),
      tables: { related },
    } as unknown as SQLiteD1Adapter

    adapter.branching = { withReadSnapshot: createD1ReadSnapshot({ adapter }) } as never
    payload.db = adapter as never
    const req = Object.assign(new Request('https://payload.test/api/related'), {
      payload,
      context: {},
      payloadDataLoader: { old: true },
    }) as unknown as PayloadRequest

    await expect(
      queryBranchContentGraph({
        branchID: 'drafts',
        collection: 'related',
        depth: 0,
        req,
        where: { id: { equals: 1 } },
      }),
    ).rejects.toMatchObject({ code: 'branch-projection-conflict' })
    expect(readAccess).toHaveBeenCalledTimes(1)
    expect(nestedHook).toHaveBeenCalledTimes(1)
    await expect(
      payload.find({ collection: 'policy-targets', req: copiedRequest! }),
    ).rejects.toMatchObject({ code: 'branch-read-snapshot-unsupported' })
    await expect(
      payload.create({
        collection: 'policy-targets',
        data: { title: 'forbidden retained copy' },
        req: copiedRequest!,
      }),
    ).rejects.toMatchObject({ code: 'branch-read-snapshot-unsupported' })
    expect(mutationHook).not.toHaveBeenCalled()
    expect(outerHook).not.toHaveBeenCalled()
    expect(nestedAdapter === adapter).toBe(false)
    expect(req.payload).toBe(payload)
    expect(req.payloadDataLoader).toEqual({ old: true })
    expect(req.transactionID).toBeUndefined()
  })

  it('should reject D1 duplicate columns, writes and a query trace beyond the finite bound', async () => {
    const duplicates = createBranchReadTrace({ binding })

    await expect(
      duplicates.binding.prepare('SELECT id, id FROM related').raw(),
    ).rejects.toMatchObject({ code: 'branch-read-snapshot-unsupported' })
    const writes = createBranchReadTrace({ binding })

    await expect(writes.binding.prepare('DELETE FROM related').all()).rejects.toMatchObject({
      code: 'branch-read-snapshot-unsupported',
    })
    await expect(
      writes.binding
        .prepare(
          'WITH selected AS (SELECT id FROM related) DELETE FROM related WHERE id IN (SELECT id FROM selected)',
        )
        .all(),
    ).rejects.toMatchObject({ code: 'branch-read-snapshot-unsupported' })
    const excessive = createBranchReadTrace({ binding })

    for (let index = 0; index < 100; index++) {
      await excessive.binding.prepare('SELECT 1 AS value').all()
    }
    await expect(excessive.binding.prepare('SELECT 1 AS value').all()).rejects.toMatchObject({
      code: 'branch-read-snapshot-unsupported',
    })
  })
})
