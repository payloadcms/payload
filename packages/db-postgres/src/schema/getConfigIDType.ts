import { type Field, fieldAffectsData } from 'payload/types'

export const getConfigIDType = (fields: Field[]): string => {
  const idField = fields.find((field) => fieldAffectsData(field) && field.name === 'id')

  if (idField) {
    if (idField.type === 'number') {
      return 'numeric'
    }

    if (idField.type === 'text') {
      return 'varchar'
    }
  }

  return 'integer'
}
