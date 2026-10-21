import type { SQL } from 'drizzle-orm'

import { and, eq, inArray, sql } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter, TransactionSQLite } from '../types.js'

type StateRead = {
  branchKey: string
  collection: string
  scopes: { rowKey: string; scopeKey: string }[]
}

/** SQLite's fixed read transaction can observe finite schema readiness coordinates together. */
export const readProjectionStates = async ({
  adapter,
  db,
  reads,
}: {
  adapter: DrizzleAdapter
  db: TransactionSQLite
  reads: StateRead[]
}): Promise<Record<string, unknown>[]> => {
  if (adapter.name !== 'sqlite') {
    throw new Error('Batched projection readiness reads require a SQLite snapshot.')
  }
  const registered = new Set(
    [
      ...Object.values(adapter.payload.collections).map(({ config }) => config),
      ...adapter.payload.globals.config,
    ].flatMap((config) => {
      const states = config.custom?.branchQueryStorage?.states

      return typeof states === 'string' ? [states] : []
    }),
  )
  const statements: { parameters: number; query: SQL }[] = []

  for (const { branchKey, collection, scopes } of reads) {
    if (!registered.has(collection)) {
      throw new Error('Unknown branch projection readiness relation.')
    }
    const tableName = adapter.tableNameMap.get(toSnakeCase(collection))
    const table = tableName && adapter.tables[tableName]

    if (!table) {
      throw new Error('Missing branch projection readiness relation.')
    }
    // Each selected coordinate consumes at most two bindings. Stay below older
    // SQLite's 999-binding and 500-compound-select limits in the same snapshot.
    for (let index = 0; index < scopes.length; index += 100) {
      const chunk = scopes.slice(index, index + 100)
      const predicate = and(
        eq(table.branchKey, branchKey),
        inArray(
          table.rowKey,
          chunk.map(({ rowKey }) => rowKey),
        ),
        inArray(
          table.scopeKey,
          chunk.map(({ scopeKey }) => scopeKey),
        ),
      )

      statements.push({
        parameters: 2 + chunk.length * 2,
        query: sql`select ${collection} as "collection", ${table.id} as "id", ${table.rowKey} as "rowKey", ${table.branchKey} as "branchKey", ${table.scopeKey} as "scopeKey", ${table.generation} as "generation", ${table.isInitialized} as "isInitialized", ${table.pendingCount} as "pendingCount" from ${table} where ${predicate}`,
      })
    }
  }
  const rows: Record<string, unknown>[] = []
  let batch: SQL[] = []
  let parameters = 0
  const flush = async () => {
    if (batch.length) {
      rows.push(...(await db.all<Record<string, unknown>>(sql.join(batch, sql` union all `))))
      batch = []
      parameters = 0
    }
  }

  for (const statement of statements) {
    if (batch.length >= 50 || parameters + statement.parameters > 900) {
      await flush()
    }
    batch.push(statement.query)
    parameters += statement.parameters
  }
  await flush()

  return rows.map((row) => ({
    ...row,
    isInitialized:
      row.isInitialized === 1 ? true : row.isInitialized === 0 ? false : row.isInitialized,
  }))
}
