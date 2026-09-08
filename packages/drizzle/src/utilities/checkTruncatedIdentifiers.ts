import { APIError } from 'payload'

import type { DrizzleAdapter } from '../types.js'

import { maxIdentifierLength } from './validateIdentifierLength.js'

const truncate = (name: string): string =>
  name.length > maxIdentifierLength ? name.slice(0, maxIdentifierLength) : name

/**
 * Warns about identifiers Postgres will silently truncate past 63 chars, and throws
 * when two of them truncate to the same name (a schema Postgres can't create anyway).
 *
 * Base table/enum names throw during construction, so this only covers concatenated
 * identifiers: companion tables, columns, and inline index/foreign key names.
 */
export const checkTruncatedIdentifiers = ({
  adapter,
  logWarnings,
}: {
  adapter: Pick<DrizzleAdapter, 'payload' | 'rawTables'>
  logWarnings: boolean
}): void => {
  const truncatedNames = new Set<string>()
  const collisions = new Set<string>()

  // finalName -> originalName, per namespace, to detect post-truncation collisions
  const tableNames = new Map<string, string>()
  const indexNames = new Map<string, string>()
  const foreignKeyNames = new Map<string, string>()

  const check = (original: string, seen: Map<string, string>) => {
    const final = truncate(original)

    const existing = seen.get(final)
    if (existing !== undefined && existing !== original) {
      collisions.add(`"${existing}" and "${original}" both become "${final}"`)
      return
    }

    seen.set(final, original)

    if (final !== original) {
      truncatedNames.add(original)
    }
  }

  for (const tableName in adapter.rawTables) {
    const table = adapter.rawTables[tableName]

    check(table.name, tableNames)

    // Columns only collide with other columns in the same table.
    const columnNames = new Map<string, string>()
    for (const columnKey in table.columns) {
      check(table.columns[columnKey].name, columnNames)
    }

    if (table.indexes) {
      for (const indexKey in table.indexes) {
        check(table.indexes[indexKey].name, indexNames)
      }
    }

    if (table.foreignKeys) {
      for (const foreignKeyKey in table.foreignKeys) {
        check(table.foreignKeys[foreignKeyKey].name, foreignKeyNames)
      }
    }
  }

  if (collisions.size > 0) {
    throw new APIError(
      `Multiple identifiers exceed Postgres's ${maxIdentifierLength}-character limit and truncate to the same name, which Postgres cannot create: ${Array.from(
        collisions,
      ).join('; ')}. Use the dbName property to give them shorter, distinct names.`,
    )
  }

  if (logWarnings && truncatedNames.size > 0) {
    adapter.payload.logger.warn(
      `The following identifiers exceed Postgres's ${maxIdentifierLength}-character limit and will be silently truncated, which can leave the database out of sync with your Payload schema: ${Array.from(
        truncatedNames,
      ).join(', ')}. Use the dbName property to shorten them.`,
    )
  }
}
