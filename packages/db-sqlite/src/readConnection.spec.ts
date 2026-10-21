/* eslint-disable payload/no-relative-monorepo-imports -- Native private-file read ownership without Payload initialization. */
import type { Client, Config, InArgs, InStatement } from '@libsql/client'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'

import { createClient } from '@libsql/client'
import { createClient as createLocalClient } from '@libsql/client/sqlite3'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { mkdtemp, mkdir, realpath, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SQLiteAdapter } from './types.js'

import { connect } from './connect.js'
import { destroy } from './destroy.js'
import {
  configureReadConnections,
  createReadTransaction,
  retireReadConnections,
} from './readConnection.js'
import { withReadTransaction } from './withReadTransaction.js'

vi.mock('@libsql/client/sqlite3', async (original) => {
  const module = await original<typeof import('@libsql/client/sqlite3')>()

  return { ...module, createClient: vi.fn(module.createClient) }
})

const records = sqliteTable('records', { id: integer().primaryKey(), title: text() })
const schema = { records }

describe('owned local SQLite read connections', () => {
  let adapter: SQLiteAdapter
  let directory: string
  let originalCwd: string
  let privateClients: Client[]
  let parents: Client[]
  let nativeMethods: WeakMap<Client, { close: Client['close']; execute: Client['execute'] }>
  let configurePrivateClient: ((args: { client: Client }) => void) | undefined

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'payload-owned-read-'))
    originalCwd = process.cwd()
    privateClients = []
    parents = []
    nativeMethods = new WeakMap()
    configurePrivateClient = undefined
    const actual =
      await vi.importActual<typeof import('@libsql/client/sqlite3')>('@libsql/client/sqlite3')

    vi.mocked(createLocalClient).mockImplementation((config) => {
      const client = actual.createClient(config)

      privateClients.push(client)
      nativeMethods.set(client, {
        close: client.close.bind(client),
        execute: client.execute.bind(client),
      })
      vi.spyOn(client, 'execute')
      vi.spyOn(client, 'close')
      configurePrivateClient?.({ client })
      return client
    })
    adapter = await createAdapter({
      config: { url: pathToFileURL(join(directory, 'data.db')).href },
    })
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    vi.restoreAllMocks()
    retireReadConnections({ adapter })
    for (const client of [...privateClients, ...parents]) {
      client.close()
    }
    vi.clearAllMocks()
    await rm(directory, { force: true, recursive: true })
  })

  const createAdapter = async ({ config }: { config: Config }): Promise<SQLiteAdapter> => {
    const client = createClient(config)

    parents.push(client)
    await client.executeMultiple(
      "PRAGMA journal_mode=WAL; CREATE TABLE records (id INTEGER PRIMARY KEY, title TEXT); INSERT INTO records VALUES (1, 'before')",
    )
    return {
      name: 'sqlite',
      client,
      clientConfig: config,
      drizzle: drizzle(client, { schema }),
      schema,
      tables: { records },
      relations: {},
      fieldConstraints: {},
      busyTimeout: 300,
      logger: false,
      push: false,
      wal: false,
      payload: { logger: { error: vi.fn(), info: vi.fn() } },
    } as unknown as SQLiteAdapter
  }

  it('should reuse only an idle query-only connection and revoke every fresh transaction facade', async () => {
    await configureReadConnections({ adapter })
    const first = await createReadTransaction({ adapter })
    const borrowedExecute = first.execute

    expect((await first.execute('PRAGMA query_only')).rows[0]?.query_only).toBe(1)
    expect((await first.execute('PRAGMA busy_timeout')).rows[0]?.timeout).toBe(300)
    expect((await first.execute('SELECT title FROM records')).rows[0]?.title).toBe('before')
    await first.commit()
    expect(first.closed).toBe(true)
    first.close()
    const second = await createReadTransaction({ adapter })

    expect(second).not.toBe(first)
    expect(privateClients).toHaveLength(1)
    await expect(borrowedExecute('SELECT title FROM records')).rejects.toThrow('no longer active')
    await expect(first.batch(['SELECT title FROM records'])).rejects.toThrow('no longer active')
    await expect(first.batch([])).rejects.toThrow('no longer active')
    expect((await second.execute('SELECT title FROM records')).rows[0]?.title).toBe('before')
    await second.commit()
    second.close()
    expect(privateClients[0]!.close).not.toHaveBeenCalled()
    expect(
      vi
        .mocked(privateClients[0]!.execute)
        .mock.calls.filter(([query]) => String(query).startsWith('SAVEPOINT')),
    ).toHaveLength(1)
    await adapter.client.execute("UPDATE records SET title = 'writable parent'")
    expect((await adapter.client.execute('SELECT title FROM records')).rows[0]?.title).toBe(
      'writable parent',
    )
  })

  it('should bind fresh Drizzle raw, relational and batch queries to the leased connection', async () => {
    await configureReadConnections({ adapter })
    const parentExecute = vi
      .spyOn(adapter.client, 'execute')
      .mockRejectedValue(new Error('Parent query'))
    const databases: object[] = []

    for (let round = 0; round < 2; round++) {
      await withReadTransaction({
        adapter,
        read: async ({ db: scoped }) => {
          const db = scoped as unknown as LibSQLDatabase<typeof schema>

          databases.push(db)
          expect(await db.all(sql`select title from records`)).toEqual([{ title: 'before' }])
          expect(await db.query.records.findMany()).toEqual([{ id: 1, title: 'before' }])
          expect(await db.batch([db.select().from(records)])).toEqual([
            [{ id: 1, title: 'before' }],
          ])
        },
      })
    }
    expect(databases[0]).not.toBe(databases[1])
    expect(parentExecute).not.toHaveBeenCalled()
    expect(privateClients).toHaveLength(1)
  })

  it('should keep overlapping WAL readers independent across a writer and close idle overflow', async () => {
    await configureReadConnections({ adapter })
    const first = await createReadTransaction({ adapter })

    expect((await first.execute('SELECT title FROM records')).rows[0]?.title).toBe('before')
    await adapter.client.execute("UPDATE records SET title = 'after'")
    const second = await createReadTransaction({ adapter })

    expect((await second.execute('SELECT title FROM records')).rows[0]?.title).toBe('after')
    expect((await first.execute('SELECT title FROM records')).rows[0]?.title).toBe('before')
    expect(privateClients).toHaveLength(2)
    await first.commit()
    const third = await createReadTransaction({ adapter })

    // Commit does not release a connection while its old owner still holds the facade.
    expect(privateClients).toHaveLength(3)
    await third.commit()
    third.close()
    await second.commit()
    second.close()
    first.close()
    expect(
      privateClients.filter((client) => vi.mocked(client.close).mock.calls.length === 0),
    ).toHaveLength(1)
    const fourth = await createReadTransaction({ adapter })

    expect(privateClients).toHaveLength(3)
    expect((await fourth.execute('SELECT title FROM records')).rows[0]?.title).toBe('after')
    await fourth.rollback()
    fourth.close()
  })

  it('should enforce query-only at the native connection and retire a caught native failure', async () => {
    await configureReadConnections({ adapter })
    const transaction = await createReadTransaction({ adapter })

    await expect(transaction.execute("UPDATE records SET title = 'forbidden'")).rejects.toThrow()
    await expect(transaction.execute('SELECT title FROM records')).rejects.toThrow()
    await transaction.rollback()
    transaction.close()
    expect(privateClients[0]!.close).toHaveBeenCalledOnce()
    const next = await createReadTransaction({ adapter })

    expect(privateClients).toHaveLength(2)
    expect((await next.execute('SELECT title FROM records')).rows[0]?.title).toBe('before')
    await next.commit()
    next.close()
  })

  it.each(['begin', 'commit', 'callback'] as const)(
    'should preserve the %s error while attempting failed rollback and close cleanup',
    async (phase) => {
      await configureReadConnections({ adapter })
      const primary = new Error(`primary ${phase}`)
      const secondary = new Error('secondary cleanup')
      let rollbackAttempts = 0

      configurePrivateClient = ({ client }) => {
        const execute = nativeMethods.get(client)!.execute
        const close = nativeMethods.get(client)!.close

        vi.mocked(client.execute).mockImplementation(
          async (statement: InStatement, args?: InArgs) => {
            if (
              (phase === 'begin' && statement === 'BEGIN DEFERRED') ||
              (phase === 'commit' && statement === 'COMMIT')
            ) {
              throw primary
            }
            if (statement === 'ROLLBACK') {
              rollbackAttempts++
              throw secondary
            }
            return execute(
              typeof statement === 'string' && args ? { args, sql: statement } : statement,
            )
          },
        )
        vi.mocked(client.close).mockImplementation(() => {
          close()
          throw secondary
        })
      }
      await expect(
        withReadTransaction({
          adapter,
          read: async ({ db }) => {
            await db.all(sql`select title from records`)
            if (phase === 'callback') throw primary
          },
        }),
      ).rejects.toBe(primary)
      expect(rollbackAttempts).toBe(phase === 'begin' ? 0 : 1)
      expect(privateClients[0]!.close).toHaveBeenCalledOnce()
      configurePrivateClient = undefined
      const next = await createReadTransaction({ adapter })

      expect(privateClients).toHaveLength(2)
      await next.commit()
      next.close()
    },
  )

  it('should preserve a lost commit acknowledgement after the native COMMIT succeeds', async () => {
    await configureReadConnections({ adapter })
    const failure = new Error('Lost commit acknowledgement')

    configurePrivateClient = ({ client }) => {
      const execute = nativeMethods.get(client)!.execute

      vi.mocked(client.execute).mockImplementation(async (statement) => {
        const result = await execute(statement)

        if (statement === 'COMMIT') throw failure
        return result
      })
    }
    await expect(
      withReadTransaction({
        adapter,
        read: async ({ db }) => db.all(sql`select title from records`),
      }),
    ).rejects.toBe(failure)
    expect(
      vi
        .mocked(privateClients[0]!.execute)
        .mock.calls.filter(([statement]) => statement === 'ROLLBACK'),
    ).toHaveLength(1)
    expect(privateClients[0]!.close).toHaveBeenCalledOnce()
    configurePrivateClient = undefined
    const next = await createReadTransaction({ adapter })

    expect(privateClients).toHaveLength(2)
    expect((await next.execute('SELECT title FROM records')).rows[0]?.title).toBe('before')
    await next.commit()
    next.close()
  })

  it('should surface overflow close failure after a successful commit', async () => {
    await configureReadConnections({ adapter })
    const failure = new Error('close failed')

    configurePrivateClient = ({ client }) => {
      if (privateClients.length === 1) {
        const close = nativeMethods.get(client)!.close

        vi.mocked(client.close).mockImplementation(() => {
          close()
          throw failure
        })
      }
    }
    await expect(
      withReadTransaction({
        adapter,
        read: () =>
          withReadTransaction({
            adapter,
            read: async ({ db }) => db.all(sql`select title from records`),
          }),
      }),
    ).rejects.toBe(failure)
    expect(privateClients).toHaveLength(2)
  })

  it.each(['query-only', 'savepoint'])(
    'should fall back before content when a private connection loses its %s capability state',
    async (phase) => {
      await configureReadConnections({ adapter })
      configurePrivateClient = ({ client }) => {
        const execute = nativeMethods.get(client)!.execute

        vi.mocked(client.execute).mockImplementation((statement: InStatement, args?: InArgs) => {
          if (phase === 'query-only' && statement === 'PRAGMA query_only') {
            return execute('PRAGMA query_only = OFF').then(() => execute(statement))
          }
          if (phase === 'savepoint' && String(statement).startsWith('ROLLBACK TO SAVEPOINT')) {
            return Promise.reject(new Error('Different connection'))
          }
          return execute(
            typeof statement === 'string' && args ? { args, sql: statement } : statement,
          )
        })
      }
      const native = vi.spyOn(adapter.client, 'transaction')
      const transaction = await createReadTransaction({ adapter })

      expect(native).toHaveBeenCalledWith('read')
      expect(privateClients[0]!.close).toHaveBeenCalledOnce()
      expect(
        vi
          .mocked(privateClients[0]!.execute)
          .mock.calls.every(([statement]) => !String(statement).includes('records')),
      ).toBe(true)
      expect((await transaction.execute('SELECT title FROM records')).rows[0]?.title).toBe('before')
      await transaction.commit()
      transaction.close()
    },
  )

  it('should retire idle and active leases when the primary is closed', async () => {
    await configureReadConnections({ adapter })
    const active = await createReadTransaction({ adapter })
    const idle = await createReadTransaction({ adapter })

    await idle.commit()
    idle.close()
    adapter.client.close()
    await expect(createReadTransaction({ adapter })).rejects.toThrow(
      'primary SQLite client is closed',
    )
    expect(privateClients[1]!.close).toHaveBeenCalledOnce()
    await expect(active.execute('SELECT title FROM records')).rejects.toThrow('no longer active')
    await active.rollback()
    active.close()
    expect(privateClients[0]!.close).toHaveBeenCalledOnce()
  })

  it.each(['number', 'string', 'bigint'] as const)(
    'should preserve the configured %s integer representation on a leased connection',
    async (intMode) => {
      adapter = await createAdapter({
        config: { url: pathToFileURL(join(directory, `${intMode}.db`)).href, intMode },
      })
      await configureReadConnections({ adapter })
      const transaction = await createReadTransaction({ adapter })

      expect(privateClients).toHaveLength(1)
      expect((await transaction.execute('SELECT id FROM records')).rows[0]?.id).toBe(
        intMode === 'number' ? 1 : intMode === 'string' ? '1' : 1n,
      )
      await transaction.commit()
      transaction.close()
    },
  )

  it('should preserve native fallback when optional primary metadata is unavailable', async () => {
    const execute = adapter.client.execute.bind(adapter.client)

    vi.spyOn(adapter.client, 'execute').mockImplementation(
      (statement: InStatement, args?: InArgs) =>
        statement === 'PRAGMA database_list'
          ? Promise.reject(new Error('Unsupported metadata'))
          : execute(typeof statement === 'string' && args ? { args, sql: statement } : statement),
    )
    await configureReadConnections({ adapter })
    const native = vi.spyOn(adapter.client, 'transaction')
    const transaction = await createReadTransaction({ adapter })

    expect(native).toHaveBeenCalledWith('read')
    expect(privateClients).toHaveLength(0)
    await transaction.commit()
    transaction.close()
  })

  it.each([
    { url: 'https://example.invalid/database' },
    { url: 'file:memory.db?mode=memory&cache=shared' },
    { url: 'file:replica.db', syncUrl: 'https://example.invalid/database' },
    { url: 'file:replica.db', syncInterval: 10 },
  ])(
    'should retain the native transaction for unsupported connection config %j',
    async (config) => {
      adapter.clientConfig = config
      await configureReadConnections({ adapter })
      const native = vi.spyOn(adapter.client, 'transaction')
      const transaction = await createReadTransaction({ adapter })

      expect(native).toHaveBeenCalledWith('read')
      expect(privateClients).toHaveLength(0)
      expect((await transaction.execute('SELECT title FROM records')).rows[0]?.title).toBe('before')
      await transaction.commit()
      transaction.close()
    },
  )

  it('should preserve the original in-memory database rather than opening a second memory client', async () => {
    adapter = await createAdapter({ config: { url: 'file::memory:' } })
    await configureReadConnections({ adapter })
    const native = vi.spyOn(adapter.client, 'transaction')
    const transaction = await createReadTransaction({ adapter })

    expect(native).toHaveBeenCalledWith('read')
    expect(privateClients).toHaveLength(0)
    expect((await transaction.execute('SELECT title FROM records')).rows[0]?.title).toBe('before')
    await transaction.commit()
    transaction.close()
  })

  it('should bind a relative special-character filename before cwd changes', async () => {
    process.chdir(directory)
    const filename = 'relative # question?.db'

    adapter = await createAdapter({ config: { url: `file:${encodeURIComponent(filename)}` } })
    await configureReadConnections({ adapter })
    await mkdir(join(directory, 'elsewhere'))
    process.chdir(join(directory, 'elsewhere'))
    const transaction = await createReadTransaction({ adapter })

    expect(vi.mocked(createLocalClient).mock.calls[0]![0].url).toBe(
      pathToFileURL(await realpath(join(directory, filename))).href,
    )
    expect((await transaction.execute('SELECT title FROM records')).rows[0]?.title).toBe('before')
    await transaction.commit()
    transaction.close()
  })

  it('should retire idle and active generations across real connect and primary replacement', async () => {
    await configureReadConnections({ adapter })
    const first = await createReadTransaction({ adapter })

    await first.commit()
    first.close()
    const firstClient = privateClients[0]!

    adapter.clientConfig.url = pathToFileURL(join(directory, 'unconnected.db')).href
    await connect.call(adapter, { hotReload: true })
    expect(firstClient.close).toHaveBeenCalledOnce()
    const active = await createReadTransaction({ adapter })

    expect((await active.execute('SELECT title FROM records')).rows[0]?.title).toBe('before')
    const oldPrimary = adapter.client
    const replacement = await createAdapter({
      config: { url: pathToFileURL(join(directory, 'replacement.db')).href },
    })

    await replacement.client.execute("UPDATE records SET title = 'replacement'")
    adapter.client = replacement.client
    adapter.clientConfig = replacement.clientConfig
    await connect.call(adapter, { hotReload: true })
    const next = await createReadTransaction({ adapter })

    oldPrimary.close()
    await expect(active.execute('SELECT title FROM records')).rejects.toThrow('no longer active')
    await active.rollback()
    active.close()
    expect(privateClients[1]!.close).toHaveBeenCalledOnce()
    expect((await next.execute('SELECT title FROM records')).rows[0]?.title).toBe('replacement')
    await next.commit()
    next.close()
  })

  it('should reject a stale capability failure without retiring or borrowing from its replacement generation', async () => {
    await configureReadConnections({ adapter })
    let releaseProbe!: () => void
    let enteredProbe!: () => void
    const entered = new Promise<void>((resolve) => {
      enteredProbe = resolve
    })
    const release = new Promise<void>((resolve) => {
      releaseProbe = resolve
    })
    const failure = new Error('Retired probe failed')

    configurePrivateClient = ({ client }) => {
      if (privateClients.length !== 1) return
      const execute = nativeMethods.get(client)!.execute

      vi.mocked(client.execute).mockImplementation(async (statement) => {
        if (String(statement).startsWith('ROLLBACK TO SAVEPOINT')) {
          enteredProbe()
          await release
          throw failure
        }
        return execute(statement)
      })
    }
    const pending = createReadTransaction({ adapter })
    // Attach rejection observation before releasing the pending native capability probe.
    const rejected = expect(pending).rejects.toBe(failure)

    await entered
    const replacement = await createAdapter({
      config: { url: pathToFileURL(join(directory, 'new-generation.db')).href },
    })

    adapter.client = replacement.client
    adapter.clientConfig = replacement.clientConfig
    await connect.call(adapter, { hotReload: true })
    const native = vi.spyOn(adapter.client, 'transaction')
    const current = await createReadTransaction({ adapter })

    releaseProbe()
    await rejected
    expect(privateClients[0]!.close).toHaveBeenCalledOnce()
    expect((await current.execute('SELECT title FROM records')).rows[0]?.title).toBe('before')
    expect(native).not.toHaveBeenCalled()
    await current.commit()
    current.close()
  })

  it('should reject a parent closed during capability setup before invoking the read callback', async () => {
    await configureReadConnections({ adapter })
    let releaseProbe!: () => void
    let enteredProbe!: () => void
    const entered = new Promise<void>((resolve) => {
      enteredProbe = resolve
    })
    const release = new Promise<void>((resolve) => {
      releaseProbe = resolve
    })

    configurePrivateClient = ({ client }) => {
      const execute = nativeMethods.get(client)!.execute

      vi.mocked(client.execute).mockImplementation(async (statement) => {
        if (String(statement).startsWith('ROLLBACK TO SAVEPOINT')) {
          enteredProbe()
          await release
        }
        return execute(statement)
      })
    }
    const read = vi.fn(async () => undefined)
    const pending = withReadTransaction({ adapter, read })
    const rejected = expect(pending).rejects.toThrow('retired during setup')

    await entered
    adapter.client.close()
    releaseProbe()
    await rejected
    expect(read).not.toHaveBeenCalled()
    expect(privateClients[0]!.close).toHaveBeenCalledOnce()
  })

  it('should share primary canonicalization and reject configure completion after actual destroy', async () => {
    const execute = adapter.client.execute.bind(adapter.client)
    let releaseMetadata!: () => void
    let enteredMetadata!: () => void
    const entered = new Promise<void>((resolve) => {
      enteredMetadata = resolve
    })
    const release = new Promise<void>((resolve) => {
      releaseMetadata = resolve
    })
    const metadata = vi.spyOn(adapter.client, 'execute').mockImplementation(async (statement) => {
      if (statement === 'PRAGMA database_list') {
        enteredMetadata()
        await release
      }
      return execute(statement)
    })
    const first = configureReadConnections({ adapter })

    await entered
    const second = configureReadConnections({ adapter })

    await destroy.call(adapter)
    releaseMetadata()
    await Promise.all([first, second])
    expect(
      metadata.mock.calls.filter(([statement]) => statement === 'PRAGMA database_list'),
    ).toHaveLength(1)
    const native = vi.spyOn(adapter.client, 'transaction')
    const fallback = await createReadTransaction({ adapter })

    expect(native).toHaveBeenCalledWith('read')
    expect(privateClients).toHaveLength(0)
    await fallback.commit()
    fallback.close()
    adapter.schema = schema
    await connect.call(adapter, { hotReload: true })
    const next = await createReadTransaction({ adapter })

    expect(privateClients).toHaveLength(1)
    await next.commit()
    next.close()
  })

  it('should admit only the current Drizzle generation after a superseding connect', async () => {
    const execute = adapter.client.execute.bind(adapter.client)
    let releaseMetadata!: () => void
    let enteredMetadata!: () => void
    const entered = new Promise<void>((resolve) => {
      enteredMetadata = resolve
    })
    const release = new Promise<void>((resolve) => {
      releaseMetadata = resolve
    })

    vi.spyOn(adapter.client, 'execute').mockImplementation(async (statement) => {
      if (statement === 'PRAGMA database_list') {
        enteredMetadata()
        await release
      }
      return execute(statement)
    })
    const originalDB = adapter.drizzle
    const first = configureReadConnections({ adapter })

    await entered
    const reconnected = connect.call(adapter, { hotReload: true })

    releaseMetadata()
    await Promise.all([first, reconnected])
    expect(adapter.drizzle).not.toBe(originalDB)
    const native = vi.spyOn(adapter.client, 'transaction')

    await withReadTransaction({
      adapter,
      read: async ({ db }) => {
        expect(await db.all(sql`select title from records`)).toEqual([{ title: 'before' }])
      },
    })
    expect(native).not.toHaveBeenCalled()
    expect(privateClients).toHaveLength(1)
  })

  it('should close idle connections and retire active leases through the actual adapter destroy wrapper', async () => {
    await configureReadConnections({ adapter })
    const active = await createReadTransaction({ adapter })
    const idle = await createReadTransaction({ adapter })

    await idle.commit()
    idle.close()
    await destroy.call(adapter)
    expect(privateClients[1]!.close).toHaveBeenCalledOnce()
    expect(privateClients[0]!.close).not.toHaveBeenCalled()
    expect(adapter.drizzle).toBeUndefined()
    await expect(active.execute('SELECT title FROM records')).rejects.toThrow('no longer active')
    await active.rollback()
    active.close()
    expect(privateClients[0]!.close).toHaveBeenCalledOnce()
    await adapter.client.execute("UPDATE records SET title = 'parent remains writable'")
  })

  it('should attempt base destroy without masking an earlier idle close failure', async () => {
    await configureReadConnections({ adapter })
    const transaction = await createReadTransaction({ adapter })

    await transaction.commit()
    transaction.close()
    const primary = new Error('idle close')
    const secondary = new Error('base destroy')
    const close = nativeMethods.get(privateClients[0]!)!.close
    const base = vi.fn(() => {
      throw secondary
    })

    vi.mocked(privateClients[0]!.close).mockImplementation(() => {
      close()
      throw primary
    })
    Object.defineProperty(adapter, 'enums', { configurable: true, get: base })
    await expect(destroy.call(adapter)).rejects.toBe(primary)
    expect(base).toHaveBeenCalledOnce()
  })
})
