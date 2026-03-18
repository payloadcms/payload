import type { DrizzleAdapter } from '../types.js'

/**
 * Returns a stable string identifying the current schema (e.g. hash of tables + localeCodes).
 * Used with schemaSyncKV to avoid duplicate schema push across workers.
 */
export function getSchemaVersion(adapter: DrizzleAdapter): string {
  // Create a stable hash based on table names and locale codes
  const tableNames = Object.keys(adapter.tables).sort()
  const localization = adapter.payload.config.localization
  const localesCodes =
    localization && localization.locales
      ? localization.locales.map((l) => (typeof l === 'string' ? l : l.code)).sort()
      : []

  const schemaData = {
    locales: localesCodes,
    tables: tableNames,
    // Include any other schema-relevant data
    localesSuffix: adapter.localesSuffix,
    relationshipsSuffix: adapter.relationshipsSuffix,
    versionsSuffix: adapter.versionsSuffix,
  }

  // Simple hash function for the schema data
  const schemaString = JSON.stringify(schemaData)
  let hash = 0
  for (let i = 0; i < schemaString.length; i++) {
    const char = schemaString.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  return `schema-${Math.abs(hash).toString(36)}`
}
