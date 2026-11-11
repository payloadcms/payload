import type { DrizzleSQLiteSnapshotJSON } from 'drizzle-kit/api'

export type SQLiteRowIDSnapshot = {
  tables: Record<
    string,
    {
      columns: Record<string, { primaryKey?: boolean; type: string }>
      foreignKeys: Record<string, { columnsFrom: string[]; columnsTo: string[]; tableTo: string }>
      name: string
    }
  >
}

/**
 * Branch copies share public array/block IDs. SQLite stores those IDs in `_uuid`
 * and uses an integer key for row ownership. Keep a mapping while rebuilding
 * tables so nested arrays and localized values continue to belong to the same row.
 */
export function migrateRowIDs({
  after: nextSnapshot,
  before: previousSnapshot,
  statements,
}: {
  after: DrizzleSQLiteSnapshotJSON
  before: DrizzleSQLiteSnapshotJSON
  statements: string[]
}): string[] {
  // Keep only the snapshot fields this conversion needs. Drizzle's Zod-derived
  // snapshot types depend on the consumer's strictNullChecks setting.
  const before = previousSnapshot as unknown as SQLiteRowIDSnapshot
  const after = nextSnapshot as unknown as SQLiteRowIDSnapshot
  const conversions = new Map<string, { direction: 'down' | 'up'; mapping: string }>()

  for (const [name, table] of Object.entries(before.tables)) {
    const next = after.tables[name]

    if (!next || !table.columns.id?.primaryKey || !next.columns.id?.primaryKey) {
      continue
    }

    const isUp =
      table.columns.id.type === 'text' &&
      !table.columns._uuid &&
      next.columns.id.type === 'integer' &&
      next.columns._uuid?.type === 'text'
    const isDown =
      table.columns.id.type === 'integer' &&
      table.columns._uuid?.type === 'text' &&
      next.columns.id.type === 'text' &&
      !next.columns._uuid

    if (isUp || isDown) {
      let mappingIndex = conversions.size
      let mapping = `__payload_row_ids_${mappingIndex}`

      while (
        before.tables[mapping] ||
        after.tables[mapping] ||
        Array.from(conversions.values()).some((conversion) => conversion.mapping === mapping)
      ) {
        mapping = `__payload_row_ids_${++mappingIndex}`
      }

      conversions.set(name, { direction: isUp ? 'up' : 'down', mapping })
    }
  }

  if (!conversions.size) {
    return statements
  }

  const copiedTables = new Set<string>()
  const rewritten = statements.map((statement) => {
    const match = statement.match(
      /^INSERT INTO `__new_((?:``|[^`])+)`\(([^)]+)\) SELECT [\s\S]+ FROM `((?:``|[^`])+)`;$/,
    )

    if (!match) {
      return statement
    }

    const name = match[3].replaceAll('``', '`')
    const table = before.tables[name]
    const conversion = conversions.get(name)
    const foreignKeys = Object.values(table?.foreignKeys ?? {}).filter(
      (key) => conversions.has(key.tableTo) && key.columnsTo.includes('id'),
    )

    if (!conversion && !foreignKeys.length) {
      return statement
    }

    copiedTables.add(name)

    const columns = match[2]
      .split(', ')
      .map((column) => column.trim().slice(1, -1).replaceAll('""', '"'))
      .filter(
        (column) => table.columns[column] || (column === '_uuid' && conversion?.direction === 'up'),
      )

    if (conversion && !columns.includes('id')) {
      throw new Error(`SQLite row ID migration requires copying the ID of table ${name}.`)
    }
    if (conversion?.direction === 'up' && !columns.includes('_uuid')) {
      columns.push('_uuid')
    }

    const expressions = columns.map((column) => {
      if (conversion && column === 'id') {
        return `(SELECT new_id FROM ${quote({ name: conversion.mapping })} WHERE old_id = source.id)`
      }
      if (conversion?.direction === 'up' && column === '_uuid') {
        return 'source.id'
      }

      const key = foreignKeys.find((key) => key.columnsFrom.includes(column))

      if (key) {
        if (key.columnsFrom.length !== 1 || key.columnsTo.length !== 1) {
          throw new Error(`Cannot migrate composite row ID reference in SQLite table ${name}.`)
        }

        return `(SELECT new_id FROM ${quote({ name: conversions.get(key.tableTo)!.mapping })} WHERE old_id = source.${quote({ name: column })})`
      }

      return `source.${quote({ name: column })}`
    })

    return `INSERT INTO ${quote({ name: `__new_${name}` })} (${columns.map((name) => quote({ name })).join(', ')}) SELECT ${expressions.join(', ')} FROM ${quote({ name })} AS source;`
  })

  for (const [name, table] of Object.entries(before.tables)) {
    if (!after.tables[name]) {
      continue
    }

    const needsCopy =
      conversions.has(name) ||
      Object.values(table.foreignKeys).some(
        (key) => conversions.has(key.tableTo) && key.columnsTo.includes('id'),
      )

    if (needsCopy && !copiedTables.has(name)) {
      throw new Error(`SQLite row ID migration requires rebuilding table ${name}.`)
    }
  }

  const setup: string[] = [
    'PRAGMA foreign_keys=OFF;',
    // PRAGMA foreign_keys cannot change inside a transaction. Refuse before any
    // content changes, rather than allowing DROP TABLE to cascade into children.
    'CREATE TEMP TABLE "__payload_row_id_guard" (foreign_keys INTEGER CONSTRAINT "Disable SQLite transactionOptions when migrating branching row IDs" CHECK (foreign_keys = 0));',
    'INSERT INTO "__payload_row_id_guard" SELECT foreign_keys FROM pragma_foreign_keys;',
    'DROP TABLE "__payload_row_id_guard";',
  ]

  for (const [name, { direction, mapping }] of conversions) {
    if (direction === 'up' && before.tables[name].columns._rowid_) {
      throw new Error(`Cannot migrate SQLite row IDs in ${name}: _rowid_ is a custom column.`)
    }

    setup.push(
      `CREATE TEMP TABLE ${quote({ name: mapping })} (old_id ${direction === 'up' ? 'TEXT' : 'INTEGER'} PRIMARY KEY, new_id ${direction === 'up' ? 'INTEGER' : 'TEXT'} NOT NULL UNIQUE);`,
      `INSERT INTO ${quote({ name: mapping })} SELECT id, ${direction === 'up' ? '_rowid_' : '_uuid'} FROM ${quote({ name })};`,
    )
  }

  return [
    ...setup,
    ...rewritten.filter((statement) => !/^PRAGMA foreign_keys\s*=/.test(statement)),
    ...Array.from(conversions.values(), ({ mapping }) => `DROP TABLE ${quote({ name: mapping })};`),
    'PRAGMA foreign_keys=ON;',
  ]
}

function quote({ name }: { name: string }): string {
  return `"${name.replaceAll('"', '""')}"`
}
