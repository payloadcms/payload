'use client'
import type { FormState } from 'payload'

type Result = {
  remainingFields: FormState
  rows: FormState[]
}

export const separateRows = (path: string, fields: FormState): Result => {
  const remainingFields: FormState = {}

  const rows = Object.entries(fields).reduce((incomingRows, [fieldPath, field]) => {
    const newRows = incomingRows

    if (fieldPath.indexOf(`${path}.`) === 0) {
      const [rowIndex] = fieldPath.replace(`${path}.`, '').split('.')
      if (!newRows[rowIndex]) {
        newRows[rowIndex] = {}
      }
      newRows[rowIndex][fieldPath.replace(`${path}.${String(rowIndex)}.`, '')] = { ...field }
    } else {
      remainingFields[fieldPath] = field
    }

    return newRows
  }, [])

  return {
    remainingFields,
    rows,
  }
}

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
