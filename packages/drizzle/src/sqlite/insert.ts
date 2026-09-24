import { getTableColumns } from 'drizzle-orm'

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
    // Size each batch from the table's columns, not from the keys of the first row.
    // Drizzle emits every column of the table for a multi-row insert, and a column
    // left to a JS-generated default (e.g. an `id` from `$defaultFn`) is bound as a
    // parameter too — so a row can bind more parameters than it has keys. Version
    // rows have no `id` key, which is how 20 rows of a 6-column table went out as
    // 120 parameters. Parameters added by ON CONFLICT ... DO UPDATE SET count once
    // per statement, so they come off the budget first.
    const colsPerRow = Object.keys(getTableColumns(table)).length
    const maxParams = 100
    const setParams = onConflictDoUpdate?.set ? Object.keys(onConflictDoUpdate.set).length : 0
    const maxRowsPerBatch = Math.max(1, Math.floor((maxParams - setParams) / colsPerRow))

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
