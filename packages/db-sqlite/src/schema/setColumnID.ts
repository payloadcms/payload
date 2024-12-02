import type { SQLiteColumnBuilder } from 'drizzle-orm/sqlite-core'
import type { FlattenedField } from 'payload'

import { integer, numeric, text } from 'drizzle-orm/sqlite-core'

import type { IDType } from '../types.js'

type Args = {
  autoIncrement: boolean
  columns: Record<string, SQLiteColumnBuilder>
  fields: FlattenedField[]
}
export const setColumnID = ({ autoIncrement, columns, fields }: Args): IDType => {
  const idField = fields.find((field) => field.name === 'id')
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

  columns.id = integer('id').primaryKey({ autoIncrement })
  return 'integer'
}
