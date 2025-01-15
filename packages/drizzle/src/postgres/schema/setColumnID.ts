import type { SetColumnID } from '../../types.js'

export const setColumnID: SetColumnID = ({ adapter, columns, fields }) => {
  const idField = fields.find((field) => field.name === 'id')

  let name: string = 'id'

  if (idField && (idField.type === 'number' || idField.type === 'text') && idField.dbColumnName) {
    name = idField.dbColumnName
  }

  if (idField) {
    if (idField.type === 'number') {
      columns.id = {
        name,
        type: 'numeric',
        primaryKey: true,
      }

      return 'numeric'
    }

    if (idField.type === 'text') {
      columns.id = {
        name,
        type: 'varchar',
        primaryKey: true,
      }
      return 'varchar'
    }
  }

  if (adapter.idType === 'uuid') {
    columns.id = {
      name,
      type: 'uuid',
      defaultRandom: true,
      primaryKey: true,
    }

    return 'uuid'
  }

  columns.id = {
    name: 'id',
    type: 'serial',
    primaryKey: true,
  }

  return 'integer'
}
