import type { FormField, FormState } from 'payload'

export const prepareFields = (
  fields: FormState,
): {
  [key: string]: Omit<FormField, 'validate'>
} => {
  return Object.keys(fields).reduce(
    (acc, key) => {
      const newField = fields[key]
      delete newField.validate
      acc[key] = newField
      return acc
    },
    {} as {
      [key: string]: Omit<FormField, 'validate'>
    },
  )
}
