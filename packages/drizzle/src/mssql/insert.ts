import { and, eq } from 'drizzle-orm'

import type { BaseMSSQLAdapter, Insert } from './types.js'

export const insert: Insert = async function (
  // Here 'this' is not a parameter. See:
  // https://www.typescriptlang.org/docs/handbook/2/classes.html#this-parameters
  this: BaseMSSQLAdapter,
  { db, onConflictDoUpdate, tableName, values },
): Promise<Record<string, unknown>[]> {
  const table = this.tables[tableName]

  // SQL Server has no `ON CONFLICT`/`MERGE` exposed through the drizzle query builder, so we
  // emulate an upsert: look for an existing row matching the conflict target, then UPDATE it,
  // otherwise INSERT. Payload only upserts a single main row through this path.
  if (onConflictDoUpdate) {
    const { set, target, targetWhere } = onConflictDoUpdate
    const row = Array.isArray(values) ? values[0] : values
    const targets = Array.isArray(target) ? target : [target]

    const conflictConditions = targets.map((column) => eq(column, (row as any)[column.name]))
    if (targetWhere) {
      conflictConditions.push(targetWhere)
    }
    const conflictWhere = and(...conflictConditions)

    const existing = await db.select().from(table).where(conflictWhere)

    if (existing.length > 0) {
      await db.update(table).set(set).where(conflictWhere)
      const updated = await db.select().from(table).where(conflictWhere)
      return updated as Record<string, unknown>[]
    }

    const inserted = await db.insert(table).output().values(row)
    return inserted as Record<string, unknown>[]
  }

  // Batch insert if limitedBoundParameters: true. SQL Server caps a single statement at 2100
  // bound parameters, so we chunk rows to stay comfortably below that.
  if (this.limitedBoundParameters && Array.isArray(values)) {
    const results: Record<string, unknown>[] = []
    const colsPerRow = Object.keys(values[0]).length
    const maxParams = 2000
    const maxRowsPerBatch = Math.max(1, Math.floor(maxParams / colsPerRow))

    for (let i = 0; i < values.length; i += maxRowsPerBatch) {
      const batch = values.slice(i, i + maxRowsPerBatch)
      const batchResult = await db.insert(table).output().values(batch)
      results.push(...(batchResult as Record<string, unknown>[]))
    }

    return results
  }

  const result = await db.insert(table).output().values(values)

  return result as Record<string, unknown>[]
}
