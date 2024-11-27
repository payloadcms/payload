import type { PgColumnBuilder } from 'drizzle-orm/pg-core'
import type { FieldAffectingData } from 'payload'

export const withDefault = (
  column: PgColumnBuilder,
  field: FieldAffectingData,
): PgColumnBuilder => {
  if (typeof field.defaultValue === 'undefined' || typeof field.defaultValue === 'function') {
    return column
  }

  if (typeof field.defaultValue === 'string' && field.defaultValue.includes("'")) {
    const escapedString = field.defaultValue.replaceAll("'", "''")
    return column.default(escapedString)
  }

  if (field.type === 'point' && Array.isArray(field.defaultValue)) {
    return column.default(`SRID=4326;POINT(${field.defaultValue[0]} ${field.defaultValue[1]})`)
  }

  return column.default(field.defaultValue)
}
