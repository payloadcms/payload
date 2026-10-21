/* eslint-disable payload/no-relative-monorepo-imports -- Exercise native snapshot helpers without initializing Payload or changing the shared integration adapter. */
import type { Client } from '@libsql/client'
import type { AnyD1Database } from 'drizzle-orm/d1'
import type { Payload, PayloadRequest } from 'payload'

import { createClient } from '@libsql/client'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { sql } from 'drizzle-orm'
import { drizzle as libsqlDrizzle } from 'drizzle-orm/libsql'
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres'
import { integer as pgInteger, pgTable, text as pgText } from 'drizzle-orm/pg-core'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import mongoose from 'mongoose'
import { randomUUID } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BasePayload, buildConfig } from 'payload'
import { Pool } from 'pg'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import type { SQLiteD1Adapter } from '../../packages/db-d1-sqlite/src/types.js'
import type { MongooseAdapter } from '../../packages/db-mongodb/src/index.js'
import type { DrizzleAdapter } from '../../packages/drizzle/src/types.js'

import { createReadSnapshot as createD1ReadSnapshot } from '../../packages/db-d1-sqlite/src/createReadSnapshot.js'
import { createReadSnapshot as createMongoReadSnapshot } from '../../packages/db-mongodb/src/branching/createReadSnapshot.js'
import { find as mongoFind } from '../../packages/db-mongodb/src/find.js'
import { buildCollectionSchema } from '../../packages/db-mongodb/src/models/buildCollectionSchema.js'
import { createMongoSchemaBuildContext } from '../../packages/db-mongodb/src/models/schemaBuildContext.js'
import { getSession } from '../../packages/db-mongodb/src/utilities/getSession.js'
import { createReadSnapshot as createSQLReadSnapshot } from '../../packages/drizzle/src/branching/createReadSnapshot.js'
import { find as sqlFind } from '../../packages/drizzle/src/find.js'
import { countDistinct as pgCountDistinct } from '../../packages/drizzle/src/postgres/countDistinct.js'
import { operatorMap } from '../../packages/drizzle/src/queries/operatorMap.js'
import { countDistinct as sqliteCountDistinct } from '../../packages/drizzle/src/sqlite/countDistinct.js'
import { beginTransaction as beginSQLTransaction } from '../../packages/drizzle/src/transactions/beginTransaction.js'
import { commitTransaction as commitSQLTransaction } from '../../packages/drizzle/src/transactions/commitTransaction.js'
import { rollbackTransaction as rollbackSQLTransaction } from '../../packages/drizzle/src/transactions/rollbackTransaction.js'
import { createBranchReadRequest } from '../../packages/payload/src/utilities/createBranchReadRequest.js'
import { createBranchReadScope } from '../../packages/payload/src/utilities/createBranchReadScope.js'
import { withBranchReadSnapshot } from '../../packages/payload/src/versions/branches/queries/withBranchReadSnapshot.js'

const unsupported = { code: 'branch-read-snapshot-unsupported' }
const mutations = {
  delete: ({ req }: { req: { transactionID?: unknown } }) =>
    Reflect.deleteProperty(req, 'transactionID'),
  define: ({ req }: { req: { transactionID?: unknown } }) =>
    Object.defineProperty(req, 'transactionID', { value: undefined }),
  replace: ({ req }: { req: { transactionID?: unknown } }) => {
    req.transactionID = undefined
  },
}

const makeScopedRequest = ({
  adapter,
  transactionID = 'pinned',
}: {
  adapter: object
  transactionID?: PayloadRequest['transactionID']
}) => {
  const payload = { db: adapter } as Payload

  return createBranchReadRequest({
    payload,
    req: { payload, context: {}, locale: 'en' } as PayloadRequest,
    transactionID,
  })
}

describe('branch snapshot transaction admission', () => {
  for (const [operation, mutate] of Object.entries(mutations)) {
    it(`should reject ${operation} of a canonical transaction without changing its native read binding`, async () => {
      const find = vi.fn(async ({ req }: { req: PayloadRequest }) => await req.transactionID)
      const scope = createBranchReadScope({ adapter: { find } })
      const req = makeScopedRequest({ adapter: scope.adapter })

      scope.setRequest({ req })
      expect(() => mutate({ req })).toThrowError(expect.objectContaining(unsupported))
      expect(await scope.adapter.find({ req })).toBe('pinned')
      expect(find).toHaveBeenCalledTimes(1)
      req.transactionID = 'pinned'
      expect(req.transactionID).toBe('pinned')
    })
  }

  it('should retain a pending transaction identity independently of its original caller request', async () => {
    const find = vi.fn(async ({ req }: { req: PayloadRequest }) => await req.transactionID)
    const scope = createBranchReadScope({ adapter: { find } })
    const payload = { db: scope.adapter } as unknown as Payload
    const original = { payload, transactionID: Promise.resolve('pinned') } as PayloadRequest
    const req = createBranchReadRequest({ payload, req: original })

    scope.setRequest({ req })
    original.transactionID = 'different'
    expect(await scope.adapter.find({ req })).toBe('pinned')
    expect(find).toHaveBeenCalledTimes(1)
  })

  it('should reject an unregistered canonical request before establishing a native binding', () => {
    const scope = createBranchReadScope({ adapter: {} })

    expect(() =>
      scope.setRequest({ req: { payload: { db: scope.adapter }, transactionID: 'pinned' } }),
    ).toThrowError(expect.objectContaining(unsupported))
  })

  it('should reject missing native transaction bindings and prevent replacing an established pin', async () => {
    const find = vi.fn((_args?: unknown) => Promise.resolve(null))
    const scope = createBranchReadScope({ adapter: { find } })
    const payload = { db: scope.adapter } as unknown as Payload
    const req = createBranchReadRequest({ payload, req: { payload } as PayloadRequest })

    scope.setRequest({ req })
    await expect(scope.adapter.find({ req } as never)).rejects.toMatchObject(unsupported)
    expect(() =>
      scope.setRequest({ req: makeScopedRequest({ adapter: scope.adapter }) }),
    ).toThrowError(expect.objectContaining(unsupported))
    expect(find).not.toHaveBeenCalled()
  })

  it('should reject an independently registered options request with a different pin before native admission', async () => {
    const find = vi.fn((_args?: unknown) => Promise.resolve(null))
    const scope = createBranchReadScope({ adapter: { find } })
    const req = makeScopedRequest({ adapter: scope.adapter })

    scope.setRequest({ req })
    await expect(
      scope.adapter.find({
        req: makeScopedRequest({ adapter: scope.adapter, transactionID: 'different' }),
      } as never),
    ).rejects.toMatchObject(unsupported)
    expect(find).not.toHaveBeenCalled()
  })

  it('should reject unregistered native request copies even when their database and transaction match', async () => {
    const find = vi.fn((_args?: unknown) => Promise.resolve(null))
    const scope = createBranchReadScope({ adapter: { find } })
    const req = makeScopedRequest({ adapter: scope.adapter })

    scope.setRequest({ req })
    for (const copied of [{ ...req }, { payload: req.payload, transactionID: req.transactionID }]) {
      await expect(scope.adapter.find({ req: copied } as never)).rejects.toMatchObject(unsupported)
    }
    expect(find).not.toHaveBeenCalled()
  })

  it('should retain the immutable pin after native admission while accepting registered locale and context forks', async () => {
    let finishRead: () => void
    let signalRead: () => void
    const isStarted = new Promise<void>((resolve) => {
      signalRead = resolve
    })
    const finished = new Promise<void>((resolve) => {
      finishRead = resolve
    })
    const find = vi.fn(async ({ req }: { req: PayloadRequest }) => {
      signalRead()
      await finished
      return { transactionID: await req.transactionID, locale: req.locale, context: req.context }
    })
    const scope = createBranchReadScope({ adapter: { find } })
    const req = makeScopedRequest({ adapter: scope.adapter })
    const nested = createBranchReadRequest({ payload: req.payload, req, locale: 'fr' })

    scope.setRequest({ req })
    nested.context.nested = true
    const result = scope.adapter.find({ req: nested })

    await isStarted
    for (const mutate of Object.values(mutations)) {
      expect(() => mutate({ req: nested })).toThrowError(expect.objectContaining(unsupported))
    }
    finishRead!()
    expect(await result).toEqual({
      transactionID: 'pinned',
      locale: 'fr',
      context: { nested: true },
    })
    expect(req.locale).toBe('en')
    expect(req.context).toEqual({})
    expect(find).toHaveBeenCalledTimes(1)
  })

  it('should revalidate an admitted queued read after the preceding native read completes', async () => {
    let finishFirst: () => void
    let signalFirst: () => void
    let hasEnded = false
    const isStarted = new Promise<void>((resolve) => {
      signalFirst = resolve
    })
    const firstFinished = new Promise<void>((resolve) => {
      finishFirst = resolve
    })
    const find = vi.fn(async (_args: { req: PayloadRequest }) => {
      signalFirst()
      await firstFinished
    })
    const scope = createBranchReadScope({
      adapter: { find },
      shouldSerializeReads: true,
      assertReadActive: () => {
        if (hasEnded) {
          throw Object.assign(new Error('expired'), unsupported)
        }
      },
    })
    const req = makeScopedRequest({ adapter: scope.adapter })

    scope.setRequest({ req })
    const first = scope.adapter.find({ req })

    await isStarted
    const queuedRequest = createBranchReadRequest({ payload: req.payload, req })
    const queued = scope.adapter.find({ req: queuedRequest })
    const rejection = queued.then(
      () => undefined,
      (error: unknown) => error,
    )

    await new Promise<void>((resolve) => setImmediate(resolve))
    hasEnded = true
    finishFirst!()
    await first
    expect(await rejection).toMatchObject(unsupported)
    expect(find).toHaveBeenCalledTimes(1)
  })
})

const isNativeEnabled = process.env.BRANCH_READ_SNAPSHOT_NATIVE === 'true'

describe.skipIf(!isNativeEnabled)('native branch snapshot transaction admission', () => {
  const tableName = `admission_${randomUUID().replaceAll('-', '')}`
  const sqlitePath = join(tmpdir(), `${tableName}.db`)
  const databaseURL = new URL(process.env.POSTGRES_URL ?? 'postgres://localhost/payload')
  const administration = new Pool({ connectionString: databaseURL.href })

  databaseURL.pathname = `/${tableName}`
  const pool = new Pool({ connectionString: databaseURL.href })
  let connection: mongoose.Connection
  let miniflare: {
    dispose: () => Promise<void>
    getD1Database: (name: string) => Promise<AnyD1Database>
  }
  let binding: AnyD1Database
  let sqliteClient: Client
  let sqliteAdapter: DrizzleAdapter
  let mongoAdapter: MongooseAdapter
  let pgAdapter: DrizzleAdapter
  let d1Adapter: SQLiteD1Adapter
  const hooks = new Map<string, ReturnType<typeof vi.fn>>()
  const payloads = new Map<string, BasePayload>()
  const request = ({ payload, transactionID }: { payload: Payload; transactionID?: string }) =>
    Object.assign(new Request('https://payload.test/api/related'), {
      context: { original: true },
      payload,
      transactionID,
    }) as unknown as PayloadRequest

  beforeAll(async () => {
    const require = createRequire(import.meta.url)
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
    await administration.query(`CREATE DATABASE ${tableName}`)
    await pool.query(`CREATE TABLE ${tableName} (id integer primary key, title text)`)
    await pool.query(`INSERT INTO ${tableName} VALUES (1, 'old')`)
    connection = await mongoose
      .createConnection(process.env.MONGODB_URL!, { dbName: tableName, monitorCommands: true })
      .asPromise()

    for (const name of ['postgres', 'sqlite', 'mongo', 'd1']) {
      const payload = new BasePayload()
      const hook = vi.fn(({ doc }) => doc)

      hooks.set(name, hook)
      payload.config = await buildConfig({
        db: mongooseAdapter({ url: process.env.MONGODB_URL! }),
        secret: 'branch-snapshot-admission',
        collections: [
          {
            slug: 'related',
            versions: false,
            access: { read: () => true },
            timestamps: false,
            hooks: { afterRead: [hook] },
            fields: [
              { name: 'id', type: 'number' },
              { name: 'title', type: 'text' },
            ],
          },
        ],
        typescript: { autoGenerate: false },
      })
      payload.collections = Object.fromEntries(
        payload.config.collections.map((config) => [config.slug, { config }]),
      ) as never
      payloads.set(name, payload)
    }
    const pgRelated = pgTable(tableName, {
      id: pgInteger('id').primaryKey(),
      title: pgText('title'),
    })
    const d1Related = sqliteTable('related', {
      id: integer('id').primaryKey(),
      title: text('title'),
    })
    const sqlAdapter = ({ payload, table }: { payload: BasePayload; table: object }) => ({
      find: sqlFind,
      idType: 'number',
      name: 'sqlite',
      operatorHandlers: [],
      operators: operatorMap,
      payload,
      schema: { related: table },
      sessions: {},
      tableNameMap: new Map([['related', 'related']]),
      tables: { related: table },
    })

    pgAdapter = {
      ...sqlAdapter({ payload: payloads.get('postgres')!, table: pgRelated }),
      name: 'postgres',
      drizzle: pgDrizzle(pool, { schema: { related: pgRelated } }),
      countDistinct: pgCountDistinct,
    } as unknown as DrizzleAdapter
    d1Adapter = {
      ...sqlAdapter({ payload: payloads.get('d1')!, table: d1Related }),
      binding,
      countDistinct: sqliteCountDistinct,
    } as unknown as SQLiteD1Adapter
    sqliteClient = createClient({ url: `file:${sqlitePath}` })
    await sqliteClient.executeMultiple(
      "CREATE TABLE related (id INTEGER PRIMARY KEY, title TEXT); INSERT INTO related VALUES (1, 'old')",
    )
    sqliteAdapter = {
      ...sqlAdapter({ payload: payloads.get('sqlite')!, table: d1Related }),
      drizzle: libsqlDrizzle(sqliteClient, { schema: { related: d1Related } }),
      countDistinct: sqliteCountDistinct,
    } as unknown as DrizzleAdapter
    const mongoPayload = payloads.get('mongo')!

    mongoPayload.db = { useBigIntForNumberIDs: false } as never
    const model = connection.model(
      'related',
      buildCollectionSchema({
        collection: mongoPayload.collections.related!.config,
        payload: mongoPayload,
        schemaBuildContext: createMongoSchemaBuildContext({ connection }),
      }),
      'related',
    )

    await model.init()
    await connection.db!.collection('related').insertOne({ _id: 1, title: 'old' } as never)
    mongoPayload.collections.related!.config.custom = { branchQueryStorage: { states: 'related' } }
    mongoAdapter = {
      collections: { related: model },
      connection,
      find: mongoFind,
      name: 'mongoose',
      defaultIDType: 'number',
      sessions: {},
      payload: mongoPayload,
    } as unknown as MongooseAdapter
    for (const [name, adapter] of [
      ['postgres', pgAdapter],
      ['sqlite', sqliteAdapter],
      ['mongo', mongoAdapter],
      ['d1', d1Adapter],
    ] as const) {
      payloads.get(name)!.db = adapter as never
    }
  }, 60_000)

  afterAll(async () => {
    if (connection) {
      await connection.dropDatabase()
      await connection.close()
    }
    sqliteClient?.close()
    await Promise.all(
      [sqlitePath, `${sqlitePath}-shm`, `${sqlitePath}-wal`].map((path) =>
        rm(path, { force: true }),
      ),
    )
    await pool.end()
    await administration.query(`DROP DATABASE IF EXISTS ${tableName} WITH (FORCE)`)
    await administration.end()
    await miniflare?.dispose()
  })

  const proveRead = async ({ name, req }: { name: string; req: PayloadRequest }) => {
    const payload = payloads.get(name)!
    const hook = hooks.get(name)!
    const before = hook.mock.calls.length

    for (const mutate of Object.values(mutations)) {
      expect(() => mutate({ req })).toThrowError(expect.objectContaining(unsupported))
      await expect(
        req.payload.db.find({
          collection: 'related',
          req: { ...req, transactionID: undefined },
        } as never),
      ).rejects.toMatchObject(unsupported)
    }
    const nestedCallback = vi.fn(() => Promise.resolve('unexpected'))

    await expect(
      withBranchReadSnapshot({ req: { ...req }, locale: 'fr', read: nestedCallback }),
    ).rejects.toMatchObject(unsupported)
    expect(nestedCallback).not.toHaveBeenCalled()
    const nested = await withBranchReadSnapshot({
      req,
      locale: 'fr',
      read: async ({ req: nestedReq }) => {
        expect(nestedReq.locale).toBe('fr')
        const result = await payload.find({
          collection: 'related',
          depth: 0,
          overrideAccess: false,
          req: nestedReq,
          where: { id: { equals: 1 } },
        })

        return result.docs[0]
      },
    })

    expect(nested).toMatchObject({ title: 'old' })
    const native = await req.payload.db.find({
      collection: 'related',
      pagination: false,
      req,
      where: { id: { equals: 1 } },
    })
    const result = await payload.find({
      collection: 'related',
      depth: 0,
      overrideAccess: false,
      req,
      where: { id: { equals: 1 } },
    })

    expect(native.docs[0]).toMatchObject({ title: 'old' })
    expect(result.docs[0]).toMatchObject({ title: 'old' })
    expect(hook).toHaveBeenCalledTimes(before + 2)
    expect(req.context).toEqual({ original: true })
  }

  it('should pin PostgreSQL owned direct and captured Payload reads without changing the original caller', async () => {
    const req = request({ payload: payloads.get('postgres')! })

    await createSQLReadSnapshot({ adapter: pgAdapter })({
      req,
      read: ({ req }) => proveRead({ name: 'postgres', req }),
    })
    expect(req.transactionID).toBeUndefined()
    await pool.query(`UPDATE ${tableName} SET title = 'old' WHERE id = 1`)
  })

  it('should pin PostgreSQL caller direct and captured Payload reads while keeping its transaction writable', async () => {
    await pgDrizzle(pool).transaction(async (db) => {
      pgAdapter.sessions.caller = { db } as never
      const req = request({ payload: payloads.get('postgres')!, transactionID: 'caller' })

      try {
        await db.execute(`UPDATE ${tableName} SET title = 'old' WHERE id = 1`)
        await createSQLReadSnapshot({ adapter: pgAdapter })({
          req,
          read: ({ req }) => proveRead({ name: 'postgres', req }),
        })
        await db.execute(`UPDATE ${tableName} SET title = 'old' WHERE id = 1`)
        expect(req.transactionID).toBe('caller')
      } finally {
        delete pgAdapter.sessions.caller
      }
    })
  })

  it('should pin native SQLite caller direct and captured Payload reads while keeping its transaction writable', async () => {
    const transactionID = await beginSQLTransaction.call(sqliteAdapter)
    const req = request({
      payload: payloads.get('sqlite')!,
      transactionID: transactionID as string,
    })
    const db = sqliteAdapter.sessions[transactionID!]?.db as never as ReturnType<
      typeof libsqlDrizzle
    >

    try {
      await db.run(sql`UPDATE related SET title = 'old' WHERE id = 1`)
      await createSQLReadSnapshot({ adapter: sqliteAdapter })({
        req,
        read: ({ req }) => proveRead({ name: 'sqlite', req }),
      })
      await db.run(sql`UPDATE related SET title = 'old' WHERE id = 1`)
      expect(req.transactionID).toBe(transactionID)
      await commitSQLTransaction.call(sqliteAdapter, transactionID!)
    } finally {
      await rollbackSQLTransaction.call(sqliteAdapter, transactionID!)
    }
  })

  for (const name of ['postgres', 'sqlite']) {
    for (const [operation, endTransaction] of [
      ['commit', commitSQLTransaction],
      ['rollback', rollbackSQLTransaction],
    ] as const) {
      it(`should reject a ${name} caller read after its actual ${operation} helper expires the original session`, async () => {
        const adapter = name === 'postgres' ? pgAdapter : sqliteAdapter
        const transactionID = await beginSQLTransaction.call(adapter)
        const req = request({
          payload: payloads.get(name)!,
          transactionID: transactionID as string,
        })
        let hasRejectedRead = false

        try {
          await expect(
            createSQLReadSnapshot({ adapter })({
              req,
              read: async ({ req }) => {
                const nativeFind = req.payload.db.find
                const first = await nativeFind({
                  collection: 'related',
                  req,
                  pagination: false,
                  where: { id: { equals: 1 } },
                })

                expect(first.docs[0]).toMatchObject({ title: 'old' })
                await endTransaction.call(adapter, transactionID!)
                await expect(
                  nativeFind({ collection: 'related', req, pagination: false }),
                ).rejects.toMatchObject(unsupported)
                await expect(
                  payloads.get(name)!.find({ collection: 'related', req, depth: 0 }),
                ).rejects.toMatchObject(unsupported)
                hasRejectedRead = true
              },
            }),
          ).rejects.toMatchObject(unsupported)
          expect(hasRejectedRead).toBe(true)
          expect(adapter.sessions[transactionID!]).toBeUndefined()
        } finally {
          await rollbackSQLTransaction.call(adapter, transactionID!)
        }
      })
    }
  }

  it('should pin D1 direct and captured Payload reads to the validated native batch trace', async () => {
    const req = request({ payload: payloads.get('d1')! })

    await createD1ReadSnapshot({ adapter: d1Adapter })({
      req,
      read: ({ req }) => proveRead({ name: 'd1', req }),
    })
    expect(req.transactionID).toBeUndefined()
    await binding.prepare("UPDATE related SET title = 'old' WHERE id = 1").run()
  })

  it('should pin MongoDB owned direct and captured Payload reads to its native snapshot session', async () => {
    const req = request({ payload: payloads.get('mongo')! })

    await createMongoReadSnapshot({ adapter: mongoAdapter, isTransactionsEnabled: true })({
      req,
      read: ({ req }) => proveRead({ name: 'mongo', req }),
    })
    expect(req.transactionID).toBeUndefined()
    await connection
      .db!.collection('related')
      .updateOne({ _id: 1 } as never, { $set: { title: 'old' } })
  })

  it('should pin MongoDB caller direct and captured Payload reads while keeping its transaction writable', async () => {
    const session = connection.getClient().startSession()

    session.startTransaction({
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    })
    mongoAdapter.sessions.caller = session
    const req = request({ payload: payloads.get('mongo')!, transactionID: 'caller' })

    try {
      await connection
        .db!.collection('related')
        .updateOne({ _id: 1 } as never, { $set: { title: 'old' } }, { session })
      await createMongoReadSnapshot({ adapter: mongoAdapter, isTransactionsEnabled: true })({
        req,
        read: ({ req }) => proveRead({ name: 'mongo', req }),
      })
      await connection
        .db!.collection('related')
        .updateOne({ _id: 1 } as never, { $set: { title: 'old' } }, { session })
      expect(session.inTransaction()).toBe(true)
      expect(req.transactionID).toBe('caller')
    } finally {
      await session.abortTransaction()
      await session.endSession()
      delete mongoAdapter.sessions.caller
    }
  })

  for (const shouldEnd of [false, true]) {
    it(`should reject a ${shouldEnd ? 'ended' : 'committed'} MongoDB caller session before any unsessioned read`, async () => {
      const session = connection.getClient().startSession()

      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      })
      mongoAdapter.sessions.caller = session
      const req = request({ payload: payloads.get('mongo')!, transactionID: 'caller' })
      const commands: string[] = []
      const listener = ({ commandName }: { commandName: string }) => commands.push(commandName)

      try {
        await createMongoReadSnapshot({ adapter: mongoAdapter, isTransactionsEnabled: true })({
          req,
          read: async ({ req }) => {
            await req.payload.db.find({
              collection: 'related',
              req,
              pagination: false,
              where: { id: { equals: 1 } },
            })
            if (shouldEnd) {
              await session.endSession()
            } else {
              await session.commitTransaction()
            }
            connection.getClient().on('commandStarted', listener)
            try {
              await expect(
                payloads.get('mongo')!.find({ collection: 'related', req, depth: 0 }),
              ).rejects.toMatchObject(unsupported)
            } finally {
              connection.getClient().off('commandStarted', listener)
            }
            expect(commands).toEqual([])
          },
        })
        // Normal adapters retain the pre-existing orphaned-session fallback.
        expect(await getSession(mongoAdapter, req)).toBeUndefined()
      } finally {
        if (session.inTransaction()) {
          await session.abortTransaction()
        }
        await session.endSession()
        delete mongoAdapter.sessions.caller
      }
    })
  }

  it('should reject a queued MongoDB caller read if its transaction expires while the preceding read is in flight', async () => {
    const session = connection.getClient().startSession()

    session.startTransaction({
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    })
    let finishFirst: () => void
    let signalFirst: () => void
    const isStarted = new Promise<void>((resolve) => {
      signalFirst = resolve
    })
    const firstFinished = new Promise<void>((resolve) => {
      finishFirst = resolve
    })
    const find = vi.fn(async function (this: MongooseAdapter, { req }: { req: PayloadRequest }) {
      const result = await connection
        .db!.collection('related')
        .findOne({ _id: 1 } as never, { session: await getSession(this, req) })

      signalFirst()
      await firstFinished
      return result
    })
    const adapter = Object.assign(Object.create(mongoAdapter), {
      sessions: { caller: session },
      find,
    }) as MongooseAdapter
    const req = request({
      payload: Object.assign(Object.create(payloads.get('mongo')!), { db: adapter }),
      transactionID: 'caller',
    })

    try {
      await createMongoReadSnapshot({ adapter, isTransactionsEnabled: true })({
        req,
        read: async ({ req }) => {
          const first = req.payload.db.find({ collection: 'related', req })

          await isStarted
          const queued = req.payload.db.find({ collection: 'related', req })
          const rejection = queued.then(
            () => undefined,
            (error: unknown) => error,
          )

          await new Promise<void>((resolve) => setImmediate(resolve))
          await session.commitTransaction()
          finishFirst!()
          await first
          expect(await rejection).toMatchObject(unsupported)
          expect(find).toHaveBeenCalledTimes(1)
        },
      })
    } finally {
      finishFirst!()
      if (session.inTransaction()) {
        await session.abortTransaction()
      }
      await session.endSession()
    }
  })

  it('should reject an expired MongoDB session inside native getSession after initial scope admission', async () => {
    const session = connection.getClient().startSession()

    session.startTransaction({
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    })
    const adapter = Object.assign(Object.create(mongoAdapter), {
      sessions: { caller: session },
      async find(this: MongooseAdapter, { req }: { req: PayloadRequest }) {
        await session.endSession()
        const nativeSession = await getSession(this, req)

        return connection
          .db!.collection('related')
          .findOne({ _id: 1 } as never, { session: nativeSession })
      },
    }) as MongooseAdapter
    const req = request({
      payload: Object.assign(Object.create(payloads.get('mongo')!), { db: adapter }),
      transactionID: 'caller',
    })
    const commands: string[] = []
    const listener = ({ commandName }: { commandName: string }) => {
      if (commandName === 'find') {
        commands.push(commandName)
      }
    }

    connection.getClient().on('commandStarted', listener)
    try {
      await expect(
        createMongoReadSnapshot({ adapter, isTransactionsEnabled: true })({
          req,
          read: ({ req }) => req.payload.db.find({ collection: 'related', req }),
        }),
      ).rejects.toMatchObject(unsupported)
      expect(commands).toEqual([])
    } finally {
      connection.getClient().off('commandStarted', listener)
      await session.endSession()
    }
  })
})
