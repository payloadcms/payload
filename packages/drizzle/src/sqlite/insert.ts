import type { BaseSQLiteAdapter, Insert } from './types.js'

export const insert: Insert = async function (
  // Here 'this' is not a parameter. See:
  // https://www.typescriptlang.org/docs/handbook/2/classes.html#this-parameters
  this: BaseSQLiteAdapter,
  { db, onConflictDoUpdate, tableName, values },
): Promise<Record<string, unknown>[]> {
  const table = this.tables[tableName]

  // Batch insert if limitedBoundParameters: true
  if (this.limitedBoundParameters && Array.isArray(values)) {
    const results: Record<string, unknown>[] = []
    const colsPerRow = Object.keys(values[0]).length
    const maxParams = 100
    const maxRowsPerBatch = Math.max(1, Math.floor(maxParams / colsPerRow))

    for (let i = 0; i < values.length; i += maxRowsPerBatch) {
      const batch = values.slice(i, i + maxRowsPerBatch)

      const batchResult = onConflictDoUpdate
        ? await db.insert(table).values(batch).onConflictDoUpdate(onConflictDoUpdate).returning()
        : await db.insert(table).values(batch).returning()

      results.push(...(batchResult as Record<string, unknown>[]))
    }

    return results
  }

  const result = onConflictDoUpdate
    ? await db.insert(table).values(values).onConflictDoUpdate(onConflictDoUpdate).returning()
    : await db.insert(table).values(values).returning()

  // See https://github.com/payloadcms/payload/pull/11831#discussion_r2010431908
  return result as Record<string, unknown>[]
}
