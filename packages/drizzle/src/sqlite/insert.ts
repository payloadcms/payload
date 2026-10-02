import { getTableColumns } from 'drizzle-orm'

import type { BaseSQLiteAdapter, Insert } from './types.js'

export const insert: Insert = async function (
  // Here 'this' is not a parameter. See:
  // https://www.typescriptlang.org/docs/handbook/2/classes.html#this-parameters
  this: BaseSQLiteAdapter,
  { db, onConflictDoNothing, onConflictDoUpdate, tableName, values },
): Promise<Record<string, unknown>[]> {
  const table = this.tables[tableName]

  // Batch insert if limitedBoundParameters: true
  if (this.limitedBoundParameters && Array.isArray(values)) {
    const results: Record<string, unknown>[] = []
    // Drizzle emits a value for every table column per row, not just the keys present on the row —
    // omitted columns fall back to their default / defaultFn, which is also a bound parameter
    const colsPerRow = Math.max(1, Object.keys(getTableColumns(table)).length)
    const maxParams = 100
    const maxRowsPerBatch = Math.max(1, Math.floor(maxParams / colsPerRow))

    for (let i = 0; i < values.length; i += maxRowsPerBatch) {
      const batch = values.slice(i, i + maxRowsPerBatch)

      const insertQuery = db.insert(table).values(batch)
      const batchResult = onConflictDoNothing
        ? await insertQuery.onConflictDoNothing(onConflictDoNothing).returning()
        : onConflictDoUpdate
          ? await insertQuery.onConflictDoUpdate(onConflictDoUpdate).returning()
          : await insertQuery.returning()

      results.push(...(batchResult as Record<string, unknown>[]))
    }

    return results
  }

  const insertQuery = db.insert(table).values(values)
  const result = onConflictDoNothing
    ? await insertQuery.onConflictDoNothing(onConflictDoNothing).returning()
    : onConflictDoUpdate
      ? await insertQuery.onConflictDoUpdate(onConflictDoUpdate).returning()
      : await insertQuery.returning()

  // See https://github.com/payloadcms/payload/pull/11831#discussion_r2010431908
  return result as Record<string, unknown>[]
}
