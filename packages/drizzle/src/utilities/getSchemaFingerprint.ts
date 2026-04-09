import { createHash } from 'crypto'

import type { DrizzleAdapter } from '../types.js'

/**
 * Serializes an object to JSON with sorted keys at every level so the same
 * structure always produces the same string (for hashing).
 */
function stringifyDeterministic(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj)
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(stringifyDeterministic).join(',') + ']'
  }
  const keys = Object.keys(obj).sort()
  const pairs = keys.map(
    (k) => JSON.stringify(k) + ':' + stringifyDeterministic((obj as Record<string, unknown>)[k]),
  )
  return '{' + pairs.join(',') + '}'
}

/**
 * Returns a stable hash identifying the current schema and connection (rawTables + schemaName + connection).
 * Used with schemaSyncKV to avoid duplicate schema push across workers.
 *
 * rawTables already encodes tables, columns, indexes, FKs, locales (via table/column structure),
 * suffixes (in table names), idType (column types), and blocksAsJSON (which tables exist).
 * schemaName is separate: same rawTables can be pushed to different Postgres schemas.
 * Connection fingerprint ensures we re-push when the target database (URL/host) changes.
 */
export function getSchemaFingerprint(adapter: DrizzleAdapter): string {
  const connectionFingerprint = adapter.getConnectionFingerprint?.() ?? ''

  const schemaData = {
    connection: connectionFingerprint,
    rawTables: stringifyDeterministic(adapter.rawTables),
    schemaName: adapter.schemaName ?? '',
  }

  const schemaString = JSON.stringify(schemaData)
  const hash = createHash('sha256').update(schemaString).digest('hex')
  return `schema-${hash}`
}
