import type { Client } from '@libsql/client'
import type * as Sqlite3 from '@libsql/client/sqlite3'
import type { Payload } from 'payload'

import { createClient } from '@libsql/client'
import { createClient as createLocalClient } from '@libsql/client/sqlite3'
import { drizzle } from 'drizzle-orm/libsql'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SQLiteAdapter } from '../../../packages/db-sqlite/src/types.js'

import {
  configureReadConnections,
  createReadTransaction,
  retireReadConnections,
} from '../../../packages/db-sqlite/src/readConnection.js'
import { instrumentBranchPerformance } from './instrumentation.js'

const created = vi.hoisted(() => [] as Client[])

vi.mock('@libsql/client/sqlite3', async (original) => {
  const module = await original<typeof Sqlite3>()
  const { createPerformanceSqliteClient } = await import('./sqliteClientObserver.js')

  return {
    ...module,
    createClient: (...args: Parameters<typeof module.createClient>) =>
      createPerformanceSqliteClient({
        create: () => {
          const client = module.createClient(...args)

          created.push(client)
          return client
        },
      }),
  }
})

describe('native private SQLite performance observation', () => {
  let directory: string
  let adapter: SQLiteAdapter
  let instrumentation: ReturnType<typeof instrumentBranchPerformance> | undefined

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'payload-perf-observer-'))
    created.length = 0
    const url = pathToFileURL(join(directory, 'content.db')).href
    const client = createClient({ url, intMode: 'bigint' })

    await client.executeMultiple(
      "PRAGMA journal_mode=WAL; CREATE TABLE records (id INTEGER PRIMARY KEY, title TEXT); INSERT INTO records VALUES (1, 'native')",
    )
    adapter = {
      name: 'sqlite',
      client,
      clientConfig: { url, intMode: 'bigint' },
      drizzle: drizzle(client),
      busyTimeout: 10,
    } as unknown as SQLiteAdapter
    await configureReadConnections({ adapter })
  })

  afterEach(async () => {
    instrumentation?.restore()
    instrumentation = undefined
    retireReadConnections({ adapter })
    adapter.client.close()
    for (const client of created) {
      client.close()
    }
    await rm(directory, { recursive: true, force: true })
  })

  const start = () => {
    instrumentation = instrumentBranchPerformance({
      payload: { db: adapter } as unknown as Payload,
    })
    return instrumentation
  }

  it('should observe actual cold setup and every warm lease command through the production module boundary', async () => {
    const observed = start()
    const first = await createReadTransaction({ adapter })

    expect(created).toHaveLength(1)
    expect((await first.execute('SELECT title FROM records')).rows[0]?.title).toBe('native')
    expect(await first.batch(['SELECT id FROM records', 'SELECT title FROM records'])).toHaveLength(
      2,
    )
    await first.commit()
    first.close()
    expect(observed.statements.map(({ sql }) => sql)).toEqual([
      'PRAGMA query_only = ON',
      'PRAGMA query_only',
      'PRAGMA busy_timeout = 10',
      expect.stringMatching(/^SAVEPOINT payload_read_/),
      expect.stringMatching(/^ROLLBACK TO SAVEPOINT payload_read_/),
      expect.stringMatching(/^RELEASE SAVEPOINT payload_read_/),
      'BEGIN DEFERRED',
      'SELECT title FROM records',
      'SELECT id FROM records',
      'SELECT title FROM records',
      'COMMIT',
    ])
    expect(observed.resources).toEqual([{ client: 1, kind: 'private-client-created' }])
    observed.reset()
    const second = await createReadTransaction({ adapter })

    expect((await second.execute('SELECT id FROM records')).rows[0]?.id).toBe(1n)
    await second.rollback()
    second.close()
    expect(created).toHaveLength(1)
    expect(observed.statements.map(({ sql }) => sql)).toEqual([
      'BEGIN DEFERRED',
      'SELECT id FROM records',
      'ROLLBACK',
    ])
    retireReadConnections({ adapter })
    expect(observed.resources.at(-1)).toMatchObject({
      kind: 'private-client-close',
      isClosed: true,
    })
  })

  it('should find retained clients and preserve native batches, methods, driver instances and restored descriptors', async () => {
    const lease = await createReadTransaction({ adapter })

    await lease.commit()
    lease.close()
    const client = created[0]!
    const execute = client.execute
    const batch = client.batch
    const observed = start()

    expect(Object.hasOwn(client, 'execute')).toBe(true)
    const actual = await vi.importActual<typeof Sqlite3>('@libsql/client/sqlite3')

    expect(client).toBeInstanceOf(actual.Sqlite3Client)
    expect(observed.resources).toEqual([{ client: 1, kind: 'private-client-observed' }])
    expect(
      await client.batch(['SELECT id FROM records', 'SELECT title FROM records'], 'read'),
    ).toHaveLength(2)
    expect(observed.statements).toEqual([
      {
        kind: 'batch',
        nativeClient: 1,
        batch: ['SELECT id FROM records', 'SELECT title FROM records'],
        batchMode: 'read',
      },
    ])
    const warmed = await createReadTransaction({ adapter })

    await warmed.execute({ sql: 'SELECT :value AS value', args: { value: 9n } })
    await warmed.commit()
    warmed.close()
    expect(observed.statements.map(({ sql }) => sql).slice(1)).toEqual([
      'BEGIN DEFERRED',
      'SELECT :value AS value',
      'COMMIT',
    ])
    observed.restore()
    observed.restore()
    expect(client.execute).toBe(execute)
    expect(client.batch).toBe(batch)
    expect(Object.hasOwn(client, 'execute')).toBe(false)
    const before = observed.statements.length

    await client.execute('SELECT id FROM records')
    expect(observed.statements).toHaveLength(before)
    // Another observation must attach to the same retained native client, without double wrapping.
    instrumentation = undefined
    const next = start()

    await client.execute('SELECT id FROM records')
    expect(next.statements).toHaveLength(1)
    expect(next.resources).toEqual([{ client: 1, kind: 'private-client-observed' }])
  })

  it('should preserve the actual rejected promise and native error identity while recording failed SQL and cleanup', async () => {
    const lease = await createReadTransaction({ adapter })

    await lease.commit()
    lease.close()
    const client = created[0]!
    const nativeExecute = client.execute
    let nativePromise: ReturnType<Client['execute']>
    let nativeError: unknown

    Object.defineProperty(client, 'execute', {
      configurable: true,
      writable: true,
      value(this: Client, ...args: Parameters<Client['execute']>) {
        nativePromise = nativeExecute.apply(this, args)
        void nativePromise.catch((error) => {
          nativeError = error
        })
        return nativePromise
      },
    })
    const descriptor = Object.getOwnPropertyDescriptor(client, 'execute')
    const observed = start()
    const returned = client.execute('SELECT missing FROM records')

    expect(returned).toBe(nativePromise!)
    await expect(returned).rejects.toMatchObject({ code: 'SQLITE_ERROR' })
    expect(await returned.catch((error) => error)).toBe(nativeError)
    expect(observed.statements).toEqual([
      expect.objectContaining({
        sql: 'SELECT missing FROM records',
        hasFailed: true,
        errorCode: 'SQLITE_ERROR',
      }),
    ])
    const writable = await createReadTransaction({ adapter })

    await expect(writable.execute("UPDATE records SET title = 'forbidden'")).rejects.toThrow()
    await writable.rollback()
    writable.close()
    expect(client.closed).toBe(true)
    expect(
      observed.statements.some(({ sql, hasFailed }) => sql?.startsWith('UPDATE') && hasFailed),
    ).toBe(true)
    expect(observed.statements.at(-1)?.sql).toBe('ROLLBACK')
    expect(observed.resources.at(-1)).toMatchObject({
      kind: 'private-client-close',
      isClosed: true,
    })
    observed.restore()
    expect(Object.getOwnPropertyDescriptor(client, 'execute')).toEqual(descriptor)
    // Creation remains the actual driver: malformed URLs reject rather than producing substitutes.
    expect(() => createLocalClient({ url: 'http://invalid.example' })).toThrow()
  })

  it('should record native transaction control and creation or close failures without changing their errors', async () => {
    const observed = start()
    const client = createLocalClient({ url: adapter.clientConfig!.url, intMode: 'bigint' })
    const transaction = await client.transaction('read')

    expect((await transaction.execute('SELECT id FROM records')).rows[0]?.id).toBe(1n)
    await transaction.rollback()
    transaction.close()
    expect(observed.statements.map(({ kind }) => kind)).toEqual([
      'transaction-begin',
      'execute',
      'transaction-rollback',
    ])
    expect(observed.resources.map(({ kind }) => kind)).toEqual([
      'private-client-created',
      'private-transaction-created',
      'private-transaction-close',
    ])
    expect(() => createLocalClient({ url: 'http://invalid.example' })).toThrow()
    expect(observed.resources.at(-1)).toMatchObject({
      kind: 'private-client-creation-failed',
      hasFailed: true,
    })
    observed.restore()
    instrumentation = undefined
    const original = client.close
    const closeFailure = new Error('close failed after native cleanup')

    client.close = function (this: Client) {
      original.call(this)
      throw closeFailure
    }
    const next = start()

    expect(() => client.close()).toThrow(closeFailure)
    expect(next.resources.at(-1)).toMatchObject({
      kind: 'private-client-close',
      hasFailed: true,
      isClosed: true,
    })
    next.restore()
    client.close = original
  })
})
