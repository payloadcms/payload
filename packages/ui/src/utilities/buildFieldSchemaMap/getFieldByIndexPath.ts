import type { ClientField, Field } from 'payload'

export const getFieldByIndexPath = (args: {
  fields: (ClientField | Field)[]
  schemaIndexPath: string // '0.1.0'
}): ClientField | Field => {
  const { fields, schemaIndexPath } = args

  const field = schemaIndexPath.split('.').reduce((acc, index) => {
    return acc?.[index]
  }, fields)

  return field
}
