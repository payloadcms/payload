import type { SQLiteColumnBuilder } from 'drizzle-orm/sqlite-core'
import type { FieldAffectingData } from 'payload'

export const withDefault = (
  column: SQLiteColumnBuilder,
  field: FieldAffectingData,
): SQLiteColumnBuilder => {
  if (typeof field.defaultValue === 'undefined' || typeof field.defaultValue === 'function')
    return column

  return column.default(field.defaultValue)
}
