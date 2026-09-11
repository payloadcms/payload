import type { SelectedFields } from 'drizzle-orm/sqlite-core'
import type { FlattenedField } from 'payload'

import type { DrizzleAdapter } from '../types.js'

type IsSQLReturningSafe = {
  adapter: DrizzleAdapter
  fields: FlattenedField[]
  selectedFields: SelectedFields
}

// This function confirms using sql `returning` will return selected fields in the correct format
// Reason: postgres drizzle returns point fields as arrays of numbers rather than GeoJSON objects
export const isSqlReturningSafe = ({
  adapter,
  fields,
  selectedFields,
}: IsSQLReturningSafe): boolean => {
  let allowSqlReturning = true

  if (adapter.name === 'postgres') {
    if (Object.keys(selectedFields).length) {
      allowSqlReturning = !Object.keys(selectedFields).some((key) => fields[key].type === 'point')
    } else {
      allowSqlReturning = !fields.some((field) => field.type === 'point')
    }
  }

  return allowSqlReturning
}
