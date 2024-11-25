import type { PgColumnBuilder } from 'drizzle-orm/pg-core'

import { numeric, serial, uuid, varchar } from 'drizzle-orm/pg-core'
import { type Field, flattenTopLevelFields } from 'payload'
import { fieldAffectsData } from 'payload/shared'

import type { BasePostgresAdapter, IDType } from '../types.js'

type Args = {
  adapter: BasePostgresAdapter
  columns: Record<string, PgColumnBuilder>
  fields?: Field[]
}
export const setColumnID = ({ adapter, columns, fields }: Args): IDType => {
  if (fields) {
    const idField = flattenTopLevelFields(fields).find(
      (field) => fieldAffectsData(field) && field.name === 'id',
    )
    if (idField) {
      if (idField.type === 'number') {
        columns.id = numeric('id').primaryKey()
        return 'numeric'
      }

      if (idField.type === 'text') {
        columns.id = varchar('id').primaryKey()
        return 'varchar'
      }
    }
  }

  if (adapter.idType === 'uuid') {
    columns.id = uuid('id').defaultRandom().primaryKey()
    return 'uuid'
  }

  columns.id = serial('id').primaryKey()
  return 'integer'
}
