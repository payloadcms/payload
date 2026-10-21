import type { Client, Config, InArgs, InStatement, Transaction } from '@libsql/client'

import { createClient } from '@libsql/client/sqlite3'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'

import type { SQLiteAdapter } from './types.js'

type Pool = {
  busyTimeout: number
  client: Client
  config: Config
  db: SQLiteAdapter['drizzle']
  idle?: Client
  isRetired: boolean
}

const configurations = new WeakMap<Client, Promise<Config | undefined>>()
const generations = new WeakMap<SQLiteAdapter, object>()
const pools = new WeakMap<SQLiteAdapter, Pool>()

/** Capture the actual connected file, including the cwd used for relative file URLs. */
export const configureReadConnections = async ({
  adapter,
}: {
  adapter: SQLiteAdapter
}): Promise<void> => {
  retireReadConnections({ adapter })
  const generation = generations.get(adapter)
  const client = adapter.client
  const db = adapter.drizzle
  const busyTimeout = adapter.busyTimeout

  if (!configurations.has(client)) {
    configurations.set(
      client,
      captureLocalFileConfig({
        client,
        config: adapter.clientConfig && { ...adapter.clientConfig },
      }),
    )
  }
  const config = await configurations.get(client)

  if (
    config &&
    !client.closed &&
    client.protocol === 'file' &&
    adapter.client === client &&
    adapter.drizzle === db &&
    generations.get(adapter) === generation
  ) {
    pools.set(adapter, { busyTimeout, client, config, db, isRetired: false })
  }
}

/** Retired active leases close during their owner cleanup and cannot re-enter the idle pool. */
export const retireReadConnections = ({ adapter }: { adapter: SQLiteAdapter }): void => {
  const pool = pools.get(adapter)

  generations.set(adapter, {})
  if (pool) {
    pools.delete(adapter)
    pool.isRetired = true
    const idle = pool.idle

    pool.idle = undefined
    idle?.close()
  }
}

/**
 * Only the local sqlite3 Client retains one connection across execute calls. A private,
 * exclusively leased, query-only client can retain its compiled schema between snapshots.
 * Remote, memory and replica clients continue using their native transaction API.
 */
export const createReadTransaction = async ({
  adapter,
}: {
  adapter: SQLiteAdapter
}): Promise<Transaction> => {
  const pool = pools.get(adapter)

  if (adapter.client.closed) {
    try {
      retireReadConnections({ adapter })
    } catch {
      // The closed primary remains the reason this operation cannot admit a read.
    }
    throw new Error('The primary SQLite client is closed.')
  }
  if (!pool || pool.client !== adapter.client || pool.db !== adapter.drizzle || pool.isRetired) {
    retireReadConnections({ adapter })
    return adapter.client.transaction('read')
  }
  const retained = pool.idle

  pool.idle = undefined
  let client: Client | undefined

  if (retained) {
    client = retained
  } else {
    try {
      client = createClient(pool.config)
      await verifyReadConnection({ busyTimeout: pool.busyTimeout, client })
    } catch (error) {
      try {
        client?.close()
      } catch {
        // The original driver transaction remains available before any domain read ran.
      }
      if (
        pool.isRetired ||
        pools.get(adapter) !== pool ||
        adapter.client !== pool.client ||
        adapter.drizzle !== pool.db
      ) {
        throw error
      }
      retireReadConnections({ adapter })
      return pool.client.transaction('read')
    }
  }
  let isOpen = false
  let isClosed = false
  let hasFailed = false
  let failure: unknown
  const markFailed = ({ error }: { error: unknown }): void => {
    if (!hasFailed) {
      failure = error
    }
    hasFailed = true
  }
  const assertOpen = (): void => {
    if (hasFailed) {
      throw failure
    }
    if (pool.client.closed && pools.get(adapter) === pool) {
      try {
        retireReadConnections({ adapter })
      } catch {
        // Preserve expired read admission while still retiring the native connection.
      }
    }
    if (!isOpen || isClosed || pool.isRetired) {
      throw new Error('The owned SQLite read connection is no longer active.')
    }
  }
  try {
    if (
      pool.isRetired ||
      pool.client.closed ||
      pool.client !== adapter.client ||
      pool.db !== adapter.drizzle
    ) {
      throw new Error('The owned SQLite read connection was retired during setup.')
    }
    await client.execute('BEGIN DEFERRED')
    isOpen = true
  } catch (error) {
    try {
      client.close()
    } catch {
      // Preserve the begin/setup failure after attempting native connection cleanup.
    }
    throw error
  }
  const execute = async (statement: InStatement, args?: InArgs) => {
    assertOpen()
    try {
      return await client.execute(
        typeof statement === 'string' && args ? { args, sql: statement } : statement,
      )
    } catch (error) {
      markFailed({ error })
      throw error
    }
  }

  return {
    batch: async (statements) => {
      assertOpen()
      const results = []

      for (const statement of statements) {
        results.push(await execute(statement))
      }
      return results
    },
    close: () => {
      if (isClosed) {
        return
      }
      isClosed = true
      if (isOpen || hasFailed || pool.isRetired || pool.idle) {
        client.close()
      } else {
        pool.idle = client
      }
    },
    get closed() {
      return !isOpen || isClosed || pool.isRetired
    },
    commit: async () => {
      assertOpen()
      try {
        await client.execute('COMMIT')
        isOpen = false
      } catch (error) {
        markFailed({ error })
        throw error
      }
    },
    execute,
    executeMultiple: () =>
      Promise.reject(new Error('Multiple SQL statements are unavailable on an owned read lease.')),
    rollback: async () => {
      if (!isOpen || isClosed) {
        return
      }
      try {
        await client.execute('ROLLBACK')
        isOpen = false
      } catch (error) {
        markFailed({ error })
        throw error
      }
    },
  }
}

const captureLocalFileConfig = async ({
  client,
  config,
}: {
  client: Client
  config?: Config
}): Promise<Config | undefined> => {
  if (!config || !isLocalFileConfig({ config }) || client.protocol !== 'file') {
    return undefined
  }
  try {
    const databases = await client.execute('PRAGMA database_list')
    const file = databases.rows.find((row) => row.name === 'main')?.file

    return typeof file === 'string' && file.length > 0
      ? { ...config, url: pathToFileURL(file).href }
      : undefined
  } catch {
    // This optional connection optimization must not prevent ordinary connection setup.
    return undefined
  }
}

/** The pinned local driver must retain connection-local state across separate execute calls. */
const verifyReadConnection = async ({
  busyTimeout,
  client,
}: {
  busyTimeout: number
  client: Client
}): Promise<void> => {
  await client.execute('PRAGMA query_only = ON')
  const settings = await client.execute('PRAGMA query_only')

  const isQueryOnly = settings.rows[0]?.query_only

  if (isQueryOnly !== 1 && isQueryOnly !== '1' && isQueryOnly !== 1n) {
    throw new Error('The local SQLite read client did not retain its query-only setting.')
  }
  if (busyTimeout > 0) {
    await client.execute(`PRAGMA busy_timeout = ${busyTimeout}`)
  }
  const savepoint = `payload_read_${randomUUID().replaceAll('-', '')}`

  await client.execute(`SAVEPOINT ${savepoint}`)
  await client.execute(`ROLLBACK TO SAVEPOINT ${savepoint}`)
  await client.execute(`RELEASE SAVEPOINT ${savepoint}`)
}

const isLocalFileConfig = ({ config }: { config?: Config }): boolean =>
  Boolean(
    config &&
    !config.syncUrl &&
    !config.syncInterval &&
    config.url.startsWith('file:') &&
    !/[?#]/.test(config.url),
  )
