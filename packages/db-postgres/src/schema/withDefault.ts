import type { PgColumnBuilder } from 'drizzle-orm/pg-core'
import type { FieldAffectingData } from 'payload'

const escapeSQLString = (input: string) => {
  return input.replace(`'`, `''`)
}

export const withDefault = (
  column: PgColumnBuilder,
  field: FieldAffectingData,
): PgColumnBuilder => {
  if (typeof field.defaultValue === 'function' || typeof field.defaultValue === 'undefined')
    return column

  return column.default(
    typeof field.defaultValue === 'string'
      ? escapeSQLString(field.defaultValue)
      : field.defaultValue,
  )
}
