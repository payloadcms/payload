import type { FormField, FormState } from 'payload'

type BlacklistedKeys = 'Field' | 'fields' | 'RowLabel' | 'validate'
const blacklistedKeys: BlacklistedKeys[] = ['validate', 'Field', 'fields', 'RowLabel']

// TODO: is there another way to do this within an existing loop? Need to explore.
// The problem is that functions/components cannot be sent through the client/server boundary.
const sanitizeField = (field: any): any => {
  Object.keys(field).forEach((key) => {
    if (typeof field[key] === 'object' && field[key] !== null) {
      sanitizeField(field[key])
    }
    if (blacklistedKeys.includes(key as BlacklistedKeys)) {
      field[key] = undefined
    }
  })
  return field
}

export const prepareFields = (
  fields: FormState,
): {
  [key: string]: Omit<FormField, BlacklistedKeys>
} => {
  return Object.keys(fields).reduce(
    (acc, key) => {
      const newField = sanitizeField(fields[key])
      acc[key] = newField
      return acc
    },
    {} as {
      [key: string]: Omit<FormField, BlacklistedKeys>
    },
  )
}
