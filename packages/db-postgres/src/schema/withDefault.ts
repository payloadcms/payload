import type { PgColumnBuilder } from 'drizzle-orm/pg-core'
import type { FieldAffectingData } from 'payload'

export const withDefault = (
  column: PgColumnBuilder,
  field: FieldAffectingData,
): PgColumnBuilder => {
  if (typeof field.defaultValue === 'function') return column

  return column.default(field.defaultValue)
}
