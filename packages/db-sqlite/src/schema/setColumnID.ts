import type { SQLiteColumnBuilder } from 'drizzle-orm/sqlite-core'

import { integer, numeric, text } from 'drizzle-orm/sqlite-core'
import { type Field, fieldAffectsData } from 'payload/types'
import { flattenTopLevelFields } from 'payload/utilities'

import type { IDType, SQLiteAdapter } from '../types.js'

type Args = {
  adapter: SQLiteAdapter
  columns: Record<string, SQLiteColumnBuilder>
  fields: Field[]
}
export const setColumnID = ({ columns, fields }: Args): IDType => {
  const idField = flattenTopLevelFields(fields).find(
    (field) => fieldAffectsData(field) && field.name === 'id',
  )
  if (idField) {
    if (idField.type === 'number') {
      columns.id = numeric('id').primaryKey()
      return 'numeric'
    }

    if (idField.type === 'text') {
      columns.id = text('id').primaryKey()
      return 'text'
    }
  }

  columns.id = integer('id').primaryKey()
  return 'integer'
}
