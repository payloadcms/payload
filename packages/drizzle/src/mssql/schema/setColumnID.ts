import type { SetColumnID } from '../../types.js'

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

  if (adapter.idType === 'uuidv7') {
    columns.id = {
      name: 'id',
      type: 'uuid',
      defaultV7: true,
      primaryKey: true,
    }

    return 'uuid'
  }

  // SQL Server auto-incrementing integer primary keys use IDENTITY.
  columns.id = {
    name: 'id',
    type: 'integer',
    autoIncrement: true,
    primaryKey: true,
  }

  return 'integer'
}
