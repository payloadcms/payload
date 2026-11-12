import type { SQL } from 'drizzle-orm'

import { sql } from 'drizzle-orm'
import { SQLiteAsyncDialect } from 'drizzle-orm/sqlite-core'
import { v4 as uuidv4, v7 as uuidv7 } from 'uuid'

import type { RowIDMigrationPlan } from './types.js'

type MigrationDatabase = {
  $client?: {
    batch: (queries: unknown[]) => Promise<unknown>
    prepare: (query: string) => { bind: (...params: unknown[]) => unknown }
  }
  all: (query: SQL) => Promise<Record<string, unknown>[]>
  batch?: (queries: unknown[]) => Promise<unknown>
  execute: (query: SQL) => Promise<{ rows: Record<string, unknown>[] } | Record<string, unknown>[]>
  run: (query: SQL) => unknown
  transaction?: (callback: (db: MigrationDatabase) => Promise<void>) => Promise<unknown>
}

/**
 * Rebuild the complete ownership graph while FK enforcement stays enabled.
 * New children reference new parents. Every row is copied before old tables are
 * dropped child-first, so CASCADE never reaches the replacement data.
 */
export async function migrateSQLBranching({
  db: inputDB,
  plan,
}: {
  db: unknown
  plan: RowIDMigrationPlan
}): Promise<void> {
  const db = inputDB as MigrationDatabase

  if (!plan.tables.length) {
    return
  }

  if (typeof db.batch === 'function') {
    const statements = await buildStatements({ db, plan })

    // libSQL and D1 batches are atomic. This also works when D1 forbids explicit
    // transaction control and changing PRAGMA foreign_keys.
    if (statements.length) {
      if (typeof db.$client?.prepare === 'function') {
        const dialect = new SQLiteAsyncDialect()
        const queries = statements.map((statement) => {
          const query = dialect.sqlToQuery(statement)
          const prepared = db.$client.prepare(query.sql)

          return query.params.length ? prepared.bind(...query.params) : prepared
        })

        await db.$client.batch(queries)
      } else {
        await db.batch(statements.map((statement) => db.run(statement)))
      }
    }
  } else if (typeof db.transaction === 'function') {
    await db.transaction(async (transaction) => {
      const statements = await buildStatements({ db: transaction, plan })

      for (const statement of statements) {
        if (plan.dialect === 'postgresql') {
          await transaction.execute(statement)
        } else {
          await transaction.run(statement)
        }
      }
    })
  } else {
    throw new Error('Row ID conversion requires an atomic database batch or transaction.')
  }
}

async function buildStatements({ db, plan }: { db: MigrationDatabase; plan: RowIDMigrationPlan }) {
  const existingColumns = new Map<string, Set<string>>()
  let sourceTables = 0
  let destinationTables = 0

  for (const table of plan.tables) {
    let columns: { name: string }[]

    if (plan.dialect === 'postgresql') {
      const result = await db.execute(
        sql`SELECT column_name AS name FROM information_schema.columns WHERE table_schema = ${table.schema || 'public'} AND table_name = ${table.name}`,
      )

      columns = (Array.isArray(result) ? result : result.rows) as { name: string }[]
    } else {
      columns = (await db.all(sql`PRAGMA table_info(${sql.identifier(table.name)})`)) as {
        name: string
      }[]
    }
    if (!columns.some(({ name }) => name === 'id')) {
      throw new Error(
        `Row ID migration cannot find table ${table.name}. Restore the expected schema before migrating.`,
      )
    }
    existingColumns.set(table.key, new Set(columns.map(({ name }) => name)))
    if (!table.conversion) {
      continue
    }
    const hasUUID = columns.some(({ name }) => name === '_uuid')

    if (hasUUID) {
      destinationTables++
    } else {
      sourceTables++
    }
  }
  if (!sourceTables && destinationTables) {
    return []
  }
  if (destinationTables) {
    throw new Error(
      'Incomplete SQL row ID conversion detected. Restore a backup or write a repair migration before proceeding.',
    )
  }

  if (plan.dialect === 'sqlite') {
    const [settings] = await db.all(sql`PRAGMA foreign_keys`)

    if (settings?.foreign_keys !== 1) {
      throw new Error('Enable SQLite foreign-key enforcement before migrating row IDs.')
    }
  }

  // Snapshot-based rebuilds must not silently discard database objects that
  // were installed outside the Payload schema/migration snapshot.
  for (const table of plan.tables) {
    if (plan.dialect === 'postgresql') {
      const result = await db.execute(sql`
        SELECT
          EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid = relation.oid AND NOT tgisinternal) AS has_triggers,
          relation.relacl IS NOT NULL AS has_grants,
          relation.relrowsecurity AS has_row_security,
          EXISTS(SELECT 1 FROM pg_index idx JOIN pg_class index_relation ON index_relation.oid = idx.indexrelid
            WHERE idx.indrelid = relation.oid AND NOT idx.indisprimary
              AND ${
                table.knownIndexes.length
                  ? sql`index_relation.relname NOT IN (${sql.join(
                      table.knownIndexes.map((name) => sql`${name}`),
                      sql`, `,
                    )})`
                  : sql`true`
              }) AS has_indexes
        FROM pg_class relation JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
        WHERE namespace.nspname = ${table.schema || 'public'} AND relation.relname = ${table.name}
      `)
      const rows = Array.isArray(result) ? result : result.rows

      if (
        rows.some(
          (row) => row.has_triggers || row.has_grants || row.has_indexes || row.has_row_security,
        )
      ) {
        throw new Error(
          `Table ${table.name} has custom triggers, grants, indexes, or row security. Write a custom row ID migration to preserve them.`,
        )
      }
    } else {
      const triggers = await db.all(
        sql`SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = ${table.name}`,
      )
      const indexes = await db.all(sql`PRAGMA index_list(${sql.identifier(table.name)})`)

      if (
        triggers.length ||
        indexes.some(
          (index) => index.origin === 'c' && !table.knownIndexes.includes(index.name as string),
        )
      ) {
        throw new Error(
          `Table ${table.name} has custom triggers or indexes. Write a custom row ID migration to preserve them.`,
        )
      }
    }
  }

  const statements = []
  const tableSQL = ({ name, schema }: { name: string; schema?: string }) =>
    schema ? sql`${sql.identifier(schema)}.${sql.identifier(name)}` : sql`${sql.identifier(name)}`
  const storageType = ({ type }: { type: string }) => {
    if (!['integer', 'numeric', 'serial', 'text', 'uuid', 'varchar'].includes(type)) {
      throw new Error(`Unsupported row ID storage type: ${type}`)
    }
    return sql.raw(
      type === 'serial' ? 'integer' : plan.dialect === 'sqlite' && type === 'uuid' ? 'text' : type,
    )
  }

  for (const table of plan.tables) {
    if (!table.conversion) {
      continue
    }
    const { newType, oldType } = table.conversion
    const mapping = tableSQL({ name: table.mapping, schema: table.schema })
    const source = tableSQL(table)

    statements.push(
      sql`CREATE TABLE ${mapping} (old_id ${storageType({ type: oldType })} PRIMARY KEY, new_id ${storageType({ type: newType })} NOT NULL UNIQUE)`,
    )
    if (plan.idType === 'number') {
      statements.push(
        sql`INSERT INTO ${mapping} SELECT id, row_number() OVER (ORDER BY id) FROM ${source}`,
      )
    } else {
      const query = sql`SELECT id FROM ${source}`
      const result = plan.dialect === 'postgresql' ? await db.execute(query) : await db.all(query)
      const rows = (Array.isArray(result) ? result : result.rows) as { id: number | string }[]

      // Stay below D1's bind-parameter limit, including numeric custom public IDs.
      for (let offset = 0; offset < rows.length; offset += 40) {
        const values = rows
          .slice(offset, offset + 40)
          .map(({ id }) => sql`(${id}, ${plan.idType === 'uuidv7' ? uuidv7() : uuidv4()})`)

        statements.push(
          sql`INSERT INTO ${mapping} (old_id, new_id) VALUES ${sql.join(values, sql`, `)}`,
        )
      }
    }
  }

  statements.push(...plan.createStatements.map((statement) => sql.raw(statement)))
  for (const table of plan.tables) {
    const columns = table.columns.filter(
      (column) =>
        existingColumns.get(table.key).has(column) || (column === '_uuid' && table.conversion),
    )
    const expressions = columns.map((column) => {
      if (column === 'id' && table.conversion) {
        return sql`(SELECT new_id FROM ${tableSQL({ name: table.mapping, schema: table.schema })} WHERE old_id = source.id)`
      }
      if (column === '_uuid' && table.conversion) {
        return sql`source.id`
      }
      const reference = table.foreignKeys.find((key) => key.column === column)

      if (reference) {
        const parent = plan.tables.find(({ key }) => key === reference.target)

        return sql`(SELECT new_id FROM ${tableSQL({ name: parent.mapping, schema: parent.schema })} WHERE old_id = source.${sql.identifier(column)})`
      }
      if (table.backfillBranch && column === '_branch') {
        return sql`COALESCE(source.${sql.identifier(column)}, ${'main'})`
      }
      return sql`source.${sql.identifier(column)}`
    })

    statements.push(
      sql`INSERT INTO ${tableSQL({ name: table.temporary, schema: table.schema })} (${sql.join(
        columns.map((column) => sql.identifier(column)),
        sql`, `,
      )}) SELECT ${sql.join(expressions, sql`, `)} FROM ${tableSQL(table)} AS source`,
    )
  }

  for (const table of [...plan.tables].reverse()) {
    statements.push(sql`DROP TABLE ${tableSQL(table)}`)
  }
  for (const table of plan.tables) {
    statements.push(
      sql`ALTER TABLE ${tableSQL({ name: table.temporary, schema: table.schema })} RENAME TO ${sql.identifier(table.name)}`,
    )
    if (plan.dialect === 'postgresql') {
      for (const column of table.serialColumns) {
        // Explicitly copied IDs must not collide with the sequence's next value.
        const qualifiedName = `${table.schema ? `"${table.schema.replaceAll('"', '""')}".` : ''}"${table.name.replaceAll('"', '""')}"`

        statements.push(
          sql`SELECT setval(pg_get_serial_sequence(${qualifiedName}, ${column}), COALESCE((SELECT max(${sql.identifier(column)}) FROM ${tableSQL(table)}), 1), EXISTS(SELECT 1 FROM ${tableSQL(table)}))`,
        )
      }
    }
  }
  statements.push(...plan.indexStatements.map((statement) => sql.raw(statement)))
  for (const table of plan.tables) {
    if (table.conversion) {
      statements.push(sql`DROP TABLE ${tableSQL({ name: table.mapping, schema: table.schema })}`)
    }
  }
  return statements
}
