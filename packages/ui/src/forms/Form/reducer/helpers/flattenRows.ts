import type { FormState } from 'payload'

export const flattenRows = (path: string, rows: FormState[]): FormState => {
  return rows.reduce(
    (fields, row, i) => ({
      ...fields,
      ...Object.entries(row).reduce((subFields, [subPath, subField]) => {
        return {
          ...subFields,
          [`${path}.${i}.${subPath}`]: { ...subField },
        }
      }, {}),
    }),
    {},
  )
}
