import type { ClientField, Field } from 'payload'

export const getFieldByIndexPath = ({
  fields,
  schemaIndexPath,
}: {
  fields: (ClientField | Field)[]
  schemaIndexPath: string // '0.1.0'
}): ClientField | Field | undefined =>
  schemaIndexPath
    .split('.')
    .map(Number)
    .reduce(
      (field, index) =>
        field && 'fields' in field && Array.isArray(field.fields) ? field.fields[index] : undefined,
      { fields } as ClientField | Field | undefined,
    )
