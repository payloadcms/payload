import type { BaseSQLiteAdapter } from './types.js'

import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { describe, expect, it } from 'vitest'

import { insert } from './insert.js'

// D1 allows at most 100 bound parameters per statement.
const D1_MAX_BOUND_PARAMETERS = 100

// A table wider than 50 columns overflows that limit when an upsert binds
// every column twice (INSERT ... ON CONFLICT ... DO UPDATE SET).
const columnCount = 51

const table = sqliteTable('wide', {
  id: integer('id').primaryKey(),
  ...Object.fromEntries(
    Array.from({ length: columnCount - 1 }, (_, i) => [`col${i + 1}`, text(`col${i + 1}`)]),
  ),
})

const buildRow = (id: number, value: string): Record<string, unknown> => ({
  id,
  ...Object.fromEntries(
    Array.from({ length: columnCount - 1 }, (_, i) => [`col${i + 1}`, `${value}${i + 1}`]),
  ),
})

describe('sqlite insert - limitedBoundParameters', () => {
  const setup = () => {
    const client = createClient({ url: 'file::memory:' })

    // Simulate the D1 bound-parameter limit
    const defaultExecute = client.execute.bind(client)
    client.execute = (async (statement: any, ...rest: any[]) => {
      const boundParameters: number = Array.isArray(statement)
        ? Math.max(...statement.map((each) => each?.args?.length ?? 0))
        : typeof statement === 'string'
          ? 0
          : (statement?.args?.length ?? 0)

      if (boundParameters > D1_MAX_BOUND_PARAMETERS) {
        throw new Error('too many SQL variables')
      }

      return defaultExecute(statement, ...rest)
    }) as typeof client.execute

    client.execute(
      `CREATE TABLE wide (id INTEGER PRIMARY KEY, ${Array.from(
        { length: columnCount - 1 },
        (_, i) => `col${i + 1} TEXT`,
      ).join(', ')})`,
    )

    const adapter = {
      limitedBoundParameters: true,
      tables: { wide: table },
    } as unknown as BaseSQLiteAdapter

    return { adapter, db: drizzle(client) as unknown as LibSQLDatabase }
  }

  it('updates a row wider than 50 columns without exceeding the bound-parameter limit', async () => {
    const { adapter, db } = setup()

    await db.insert(table).values(buildRow(1, 'initial')).run()

    const updatedRow = buildRow(1, 'updated')

    const [result] = await insert.call(adapter, {
      db,
      onConflictDoUpdate: { set: updatedRow, target: table.id },
      tableName: 'wide',
      values: updatedRow,
    })

    expect(result).toMatchObject(updatedRow)

    const [stored] = await db.select().from(table).all()
    expect(stored).toMatchObject(updatedRow)
  })

  it('still inserts when the upsert target row does not exist yet', async () => {
    const { adapter, db } = setup()

    const newRow = buildRow(1, 'created')

    const [result] = await insert.call(adapter, {
      db,
      onConflictDoUpdate: { set: newRow, target: table.id },
      tableName: 'wide',
      values: newRow,
    })

    expect(result).toMatchObject(newRow)

    const rows = await db.select().from(table).all()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject(newRow)
  })

  it('keeps DO UPDATE WHERE semantics - no-op when the condition does not match', async () => {
    const { adapter, db } = setup()

    await db.insert(table).values(buildRow(1, 'initial')).run()

    const result = await insert.call(adapter, {
      db,
      onConflictDoUpdate: { set: buildRow(1, 'updated'), target: table.id, where: sql`1 = 0` },
      tableName: 'wide',
      values: buildRow(1, 'updated'),
    })

    expect(result).toHaveLength(0)

    const [stored] = await db.select().from(table).all()
    expect(stored).toMatchObject(buildRow(1, 'initial'))
  })

  it('batches multi-row upserts on wide tables within the limit', async () => {
    const { adapter, db } = setup()

    const rows = Array.from({ length: 5 }, (_, i) => buildRow(i + 1, `batch${i + 1}-`))

    const result = await insert.call(adapter, {
      db,
      onConflictDoUpdate: { set: rows[0], target: table.id },
      tableName: 'wide',
      values: rows,
    })

    expect(result).toHaveLength(rows.length)

    const stored = await db.select().from(table).all()
    expect(stored).toHaveLength(rows.length)
  })
})
