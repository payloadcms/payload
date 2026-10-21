/* eslint-disable @typescript-eslint/no-explicit-any -- Observe native client boundaries without changing query execution. */
import type { Payload } from 'payload'

import { observePerformanceSqliteClients } from './sqliteClientObserver.js'

export const instrumentBranchPerformance = ({ payload }: { payload: Payload }) => {
  const adapter = payload.db as any
  const restorers: (() => void)[] = []
  const statements: {
    affectedRows?: number
    batch?: unknown[]
    batchMode?: string
    collection?: string
    durationMilliseconds?: number
    errorCode?: string
    hasFailed?: boolean
    kind: string
    nativeClient?: number
    params?: unknown[]
    pipeline?: unknown[]
    sql?: string
  }[] = []
  const resources: {
    client?: number
    hasFailed?: boolean
    isClosed?: boolean
    kind:
      | 'private-client-close'
      | 'private-client-created'
      | 'private-client-creation-failed'
      | 'private-client-observed'
      | 'private-transaction-close'
      | 'private-transaction-created'
  }[] = []
  const intercept = ({
    target,
    key,
    observe,
  }: {
    key: string
    observe: (args: any[]) => (typeof statements)[number] | undefined | void
    target: any
  }) => {
    const original = target[key]
    const descriptor = Object.getOwnPropertyDescriptor(target, key)
    const wrapper = function (this: any, ...args: any[]) {
      const statement = observe(args)
      const isWrite = statement && /^\s*(?:insert|update|delete)\b/i.test(statement.sql ?? '')
      if (isWrite && typeof args[args.length - 1] === 'function') {
        const callback = args[args.length - 1]
        args[args.length - 1] = function (...callbackArgs: any[]) {
          const result = callbackArgs[1]
          statement.affectedRows = result?.rowCount ?? result?.rowsAffected
          return callback.apply(this, callbackArgs)
        }
      }
      const result = original.apply(this, args)
      if (isWrite && result?.then) {
        result.then(
          (result: any) => {
            statement.affectedRows = result?.rowCount ?? result?.rowsAffected
          },
          () => undefined,
        )
      }
      return result
    }
    target[key] = wrapper
    restorers.push(() => {
      if (target[key] === wrapper) {
        if (descriptor) {
          Object.defineProperty(target, key, descriptor)
        } else {
          delete target[key]
        }
      }
    })
  }

  if (adapter.name === 'mongoose') {
    const client = adapter.connection.getClient()
    const active = new Map<number, (typeof statements)[number]>()
    const onSucceeded = (event: any) => {
      const statement = active.get(event.requestId)

      if (statement) {
        statement.durationMilliseconds = event.duration
        const reply = event.reply
        if (
          reply &&
          ['bulkWrite', 'delete', 'findAndModify', 'insert', 'update'].includes(statement.kind)
        ) {
          statement.affectedRows =
            statement.kind === 'update'
              ? (reply.nModified ?? 0) + (reply.upserted?.length ?? 0)
              : statement.kind === 'findAndModify'
                ? reply.lastErrorObject?.n
                : (reply.n ?? reply.nInserted ?? reply.nDeleted)
        }
        active.delete(event.requestId)
      }
    }
    const onCommand = (event: any) => {
      if (
        event.databaseName !== adapter.connection.db.databaseName &&
        event.commandName !== 'commitTransaction' &&
        event.commandName !== 'abortTransaction'
      ) {
        return
      }
      const statement = {
        collection: event.command.aggregate ?? event.command.find,
        kind: event.commandName,
        ...(Array.isArray(event.command.pipeline) ? { pipeline: event.command.pipeline } : {}),
      }
      statements.push(statement)
      active.set(event.requestId, statement)
    }

    if (!client.monitorCommands) {
      throw new Error('The Mongo performance fixture must enable native command monitoring.')
    }
    client.on('commandStarted', onCommand)
    client.on('commandSucceeded', onSucceeded)
    client.on('commandFailed', onSucceeded)
    restorers.push(() => {
      client.off('commandStarted', onCommand)
      client.off('commandSucceeded', onSucceeded)
      client.off('commandFailed', onSucceeded)
    })
  } else if (adapter.pool) {
    const seen = new WeakSet<object>()
    const observe = (args: any[]) => {
      const statement = args[0]

      const entry = {
        kind: 'query',
        sql: typeof statement === 'string' ? statement : statement.text,
        params: typeof statement === 'string' ? args[1] : (statement.values ?? args[1]),
      }
      statements.push(entry)
      return entry
    }

    const connect = adapter.pool.connect
    const instrumentClient = (client: any) => {
      if (client && !seen.has(client)) {
        seen.add(client)
        intercept({ target: client, key: 'query', observe })
      }
      return client
    }

    adapter.pool.connect = function (...args: any[]) {
      const callback = args[args.length - 1]

      if (typeof callback === 'function') {
        args[args.length - 1] = (error: unknown, client: any, release: unknown) =>
          callback(error, instrumentClient(client), release)
        return connect.apply(this, args)
      }
      return connect.apply(this, args).then(instrumentClient)
    }
    restorers.push(() => {
      adapter.pool.connect = connect
    })
  } else {
    let nextClient = 0
    const observed = new WeakSet<object>()
    const observePrivateClient = ({
      client,
      isNew,
      isTransaction = false,
    }: {
      client: any
      isNew: boolean
      isTransaction?: boolean
    }) => {
      if (client === adapter.client || observed.has(client)) {
        return
      }
      observed.add(client)
      const id = ++nextClient

      resources.push({
        client: id,
        kind: isTransaction
          ? 'private-transaction-created'
          : isNew
            ? 'private-client-created'
            : 'private-client-observed',
      })
      for (const key of [
        'execute',
        'batch',
        'executeMultiple',
        'transaction',
        'commit',
        'rollback',
        'close',
      ]) {
        if (typeof client[key] !== 'function') {
          continue
        }
        const original = client[key]
        const descriptor = Object.getOwnPropertyDescriptor(client, key)
        const wrapper = function (this: any, ...args: any[]) {
          const isClose = key === 'close'
          const entry = isClose
            ? undefined
            : ({
                kind: ['commit', 'rollback', 'transaction'].includes(key)
                  ? `transaction-${key === 'transaction' ? 'begin' : key}`
                  : key,
                nativeClient: id,
                ...(key === 'execute' || key === 'executeMultiple'
                  ? {
                      sql: typeof args[0] === 'string' ? args[0] : args[0].sql,
                      params: typeof args[0] === 'string' ? args[1] : args[0].args,
                    }
                  : {}),
                ...(key === 'batch' ? { batch: args[0], batchMode: args[1] } : {}),
              } as (typeof statements)[number])
          const resource: (typeof resources)[number] | undefined = isClose
            ? {
                client: id,
                kind: isTransaction
                  ? ('private-transaction-close' as const)
                  : ('private-client-close' as const),
                isClosed: client.closed,
              }
            : undefined

          if (entry) {
            statements.push(entry)
          }
          if (resource) {
            resources.push(resource)
          }
          const failed = (error: any) => {
            if (entry) {
              entry.hasFailed = true
              if (typeof error?.code === 'string') {
                entry.errorCode = error.code
              }
            }
            if (resource) {
              resource.hasFailed = true
              resource.isClosed = client.closed
            }
          }
          const succeeded = (result: any) => {
            if (entry && /^\s*(?:insert|update|delete)\b/i.test(entry.sql ?? '')) {
              entry.affectedRows = result?.rowsAffected
            }
            if (resource) {
              resource.isClosed = client.closed
            }
            if (key === 'transaction') {
              observePrivateClient({ client: result, isNew: true, isTransaction: true })
            }
          }
          try {
            const result = original.apply(this, args)

            if (result?.then) {
              result.then(succeeded, failed)
            } else {
              succeeded(result)
            }
            return result
          } catch (error) {
            failed(error)
            throw error
          }
        }

        client[key] = wrapper
        restorers.push(() => {
          if (client[key] === wrapper) {
            if (descriptor) {
              Object.defineProperty(client, key, descriptor)
            } else {
              delete client[key]
            }
          }
        })
      }
    }
    const stopObserving = observePerformanceSqliteClients({
      observe: observePrivateClient,
      onCreationFailed: () =>
        resources.push({ kind: 'private-client-creation-failed', hasFailed: true }),
    })

    restorers.push(stopObserving)
    const observe = (args: any[]) => {
      const statement = args[0]

      const entry = {
        kind: 'execute',
        sql: typeof statement === 'string' ? statement : statement.sql,
        params: typeof statement === 'string' ? args[1] : statement.args,
      }
      statements.push(entry)
      return entry
    }

    intercept({ target: adapter.client, key: 'execute', observe })
    const transaction = adapter.client.transaction
    const transactionDescriptor = Object.getOwnPropertyDescriptor(adapter.client, 'transaction')

    const transactionWrapper = async function (this: any, ...args: any[]) {
      statements.push({ kind: 'transaction-begin' })
      const client = await transaction.apply(this, args)

      for (const key of ['commit', 'rollback']) {
        intercept({
          target: client,
          key,
          observe: () => {
            statements.push({ kind: `transaction-${key}` })
          },
        })
      }
      intercept({ target: client, key: 'execute', observe })
      return client
    }
    adapter.client.transaction = transactionWrapper
    restorers.push(() => {
      if (adapter.client.transaction === transactionWrapper) {
        if (transactionDescriptor) {
          Object.defineProperty(adapter.client, 'transaction', transactionDescriptor)
        } else {
          delete adapter.client.transaction
        }
      }
    })
  }

  return {
    observationBoundary:
      adapter.name === 'mongoose'
        ? 'MongoDB native command events'
        : adapter.pool
          ? 'PostgreSQL native query invocations'
          : 'SQLite native Client/Transaction method invocations; batch and executeMultiple each count once; driver-internal statements are not separately traced',
    get resources() {
      return resources
    },
    get statements() {
      return statements
    },
    reset() {
      statements.length = 0
    },
    restore() {
      while (restorers.length) {
        restorers.pop()!()
      }
    },
    async explain() {
      const results = []

      for (const statement of [...statements]) {
        if (statement.pipeline) {
          const collection = adapter.connection.db.collection(statement.collection)
          const explanation = await collection
            .aggregate(statement.pipeline)
            .explain('executionStats')

          results.push({ statement, explanation })
        } else if (statement.sql && /^\s*(?:select|with)\b/i.test(statement.sql)) {
          const explanation = adapter.pool
            ? (
                await adapter.pool.query(
                  `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${statement.sql}`,
                  statement.params,
                )
              ).rows
            : (
                await adapter.client.execute({
                  sql: `EXPLAIN QUERY PLAN ${statement.sql}`,
                  args: statement.params ?? [],
                })
              ).rows

          results.push({ statement, explanation })
        }
      }
      return results
    },
  }
}

export const readBranchPerformanceStorage = async ({ payload }: { payload: Payload }) => {
  const adapter = payload.db as any

  if (adapter.name === 'mongoose') {
    const stats = await adapter.connection.db.command({ dbStats: 1 })
    const collections = []

    for (const name of await adapter.connection.db
      .listCollections({}, { nameOnly: true })
      .toArray()) {
      const collection = await adapter.connection.db.command({ collStats: name.name })

      collections.push({
        name: name.name,
        documents: collection.count,
        dataBytes: collection.size,
        allocatedBytes: collection.storageSize,
        indexBytes: collection.totalIndexSize,
      })
    }

    return {
      collections,
      dataBytes: stats.dataSize,
      allocatedBytes: stats.storageSize,
      indexBytes: stats.indexSize,
      objects: stats.objects,
    }
  }
  if (adapter.pool) {
    const result = await adapter.pool.query('SELECT pg_database_size(current_database()) AS bytes')
    const tables = await adapter.pool.query(
      "SELECT c.relname AS name, pg_table_size(c.oid) AS data_bytes, pg_indexes_size(c.oid) AS index_bytes, pg_total_relation_size(c.oid) AS total_bytes FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = current_schema() AND c.relkind = 'r'",
    )

    return { allocatedBytes: Number(result.rows[0].bytes), tables: tables.rows }
  }
  const count = await adapter.client.execute('PRAGMA page_count')
  const size = await adapter.client.execute('PRAGMA page_size')
  const free = await adapter.client.execute('PRAGMA freelist_count')
  let tables: unknown = null

  try {
    tables = (
      await adapter.client.execute('SELECT name, SUM(pgsize) AS bytes FROM dbstat GROUP BY name')
    ).rows
  } catch {
    // libSQL builds without dbstat still report actual allocated and free pages.
  }

  return {
    allocatedBytes: Number(count.rows[0].page_count) * Number(size.rows[0].page_size),
    usedPageBytes:
      (Number(count.rows[0].page_count) - Number(free.rows[0].freelist_count)) *
      Number(size.rows[0].page_size),
    tables,
  }
}
