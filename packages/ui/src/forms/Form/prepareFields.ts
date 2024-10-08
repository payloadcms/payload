import type { FormField, FormState } from 'payload'

// TODO: is there another way to do this within an existing loop?
// Need to explore. The problem is that function cannot be sent through the client/server boundary.
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
