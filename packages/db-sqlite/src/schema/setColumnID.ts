import type { SetColumnID } from '@payloadcms/drizzle/types'

export const setColumnID: SetColumnID = ({ columns, fields }) => {
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

  columns.id = {
    name: 'id',
    type: 'integer',
    primaryKey: true,
  }

  return 'integer'
}
