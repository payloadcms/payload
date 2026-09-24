import { SQL, sql } from 'drizzle-orm'

import type { BaseSQLiteAdapter, Insert } from './types.js'

type OnConflictDoUpdate = NonNullable<Parameters<Insert>[0]['onConflictDoUpdate']>

/**
 * Adapters with `limitedBoundParameters` (D1) allow at most 100 bound parameters per statement.
 * `INSERT ... ON CONFLICT ... DO UPDATE SET` binds every column twice - once in `VALUES` and
 * once in the `SET` clause - so a single-row upsert overflows the limit on any table wider
 * than 50 columns (`too many SQL variables`).
 *
 * Referencing the conflicting row's proposed values through SQLite's `excluded` table binds
 * each column only once (in `VALUES`) and keeps the upsert semantics - including the
 * `DO UPDATE ... WHERE` clause - identical.
 */
const withExcludedSet = (
  onConflictDoUpdate: OnConflictDoUpdate,
  table: BaseSQLiteAdapter['tables'][string],
  values: Record<string, unknown> | Record<string, unknown>[],
): OnConflictDoUpdate => {
  if (!onConflictDoUpdate.set) {
    return onConflictDoUpdate
  }

  const rows = Array.isArray(values) ? values : [values]

  const set = Object.fromEntries(
    Object.entries(onConflictDoUpdate.set).map(([key, value]) => {
      const column = table[key]

      // Values that are already SQL, and columns absent from the inserted row(s),
      // cannot be referenced through `excluded` - keep them bound as-is.
      if (value instanceof SQL || !column || !rows.every((row) => row && key in row)) {
        return [key, value]
      }

      return [key, sql.raw(`excluded."${column.name.replaceAll('"', '""')}"`)]
    }),
  )

  return { ...onConflictDoUpdate, set }
}

export const insert: Insert = async function (
  // Here 'this' is not a parameter. See:
  // https://www.typescriptlang.org/docs/handbook/2/classes.html#this-parameters
  this: BaseSQLiteAdapter,
  { db, onConflictDoUpdate, tableName, values },
): Promise<Record<string, unknown>[]> {
  const table = this.tables[tableName]

  const conflictConfig = this.limitedBoundParameters
    ? (onConflictDoUpdate && withExcludedSet(onConflictDoUpdate, table, values)) ||
      onConflictDoUpdate
    : onConflictDoUpdate

  // Batch insert if limitedBoundParameters: true
  if (this.limitedBoundParameters && Array.isArray(values)) {
    const results: Record<string, unknown>[] = []
    const colsPerRow = Object.keys(values[0]).length
    const maxParams = 100
    const maxRowsPerBatch = Math.max(1, Math.floor(maxParams / colsPerRow))

    for (let i = 0; i < values.length; i += maxRowsPerBatch) {
      const batch = values.slice(i, i + maxRowsPerBatch)

      const batchResult = conflictConfig
        ? await db.insert(table).values(batch).onConflictDoUpdate(conflictConfig).returning()
        : await db.insert(table).values(batch).returning()

      results.push(...(batchResult as Record<string, unknown>[]))
    }

    return results
  }

  const result = conflictConfig
    ? await db.insert(table).values(values).onConflictDoUpdate(conflictConfig).returning()
    : await db.insert(table).values(values).returning()

  // See https://github.com/payloadcms/payload/pull/11831#discussion_r2010431908
  return result as Record<string, unknown>[]
}
