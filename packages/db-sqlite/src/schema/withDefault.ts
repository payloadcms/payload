import type { SQLiteColumnBuilder } from 'drizzle-orm/sqlite-core'
import type { FieldAffectingData } from 'payload'

export const withDefault = (
  column: SQLiteColumnBuilder,
  field: FieldAffectingData,
): SQLiteColumnBuilder => {
  if (typeof field.defaultValue === 'undefined' || typeof field.defaultValue === 'function') {
    return column
  }

  if (typeof field.defaultValue === 'string' && field.defaultValue.includes("'")) {
    const escapedString = field.defaultValue.replaceAll("'", "''")
    return column.default(escapedString)
  }

  return column.default(field.defaultValue)
}
