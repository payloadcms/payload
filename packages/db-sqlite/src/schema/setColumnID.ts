import type { SetColumnID } from '@payloadcms/drizzle/types'

import type { SQLiteAdapter } from '../types.js'

export const setColumnID: SetColumnID = ({ adapter, columns, fields }) => {
  const idField = fields.find((field) => field.name === 'id')
  if (idField) {
    if (idField.type === 'number') {
      columns.id = {
        name: 'id',
        type: 'numeric',
        primaryKey: true,
      }
      return 'numeric'
    }

    if (idField.type === 'text') {
      columns.id = {
        name: 'id',
        type: 'text',
        primaryKey: true,
      }
      return 'text'
    }
  }

  if (adapter.idType === 'uuid') {
    columns.id = {
      name: 'id',
      type: 'uuid',
      defaultRandom: true,
      primaryKey: true,
    }

    return 'uuid'
  }

  columns.id = {
    name: 'id',
    type: 'integer',
    autoIncrement: (adapter as unknown as SQLiteAdapter).autoIncrement,
    primaryKey: true,
  }

  return 'integer'
}
