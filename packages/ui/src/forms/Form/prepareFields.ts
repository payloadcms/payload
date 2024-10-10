import type { FormField, FormState } from 'payload'

type BlacklistedKeys = 'Field' | 'fields' | 'RowLabel' | 'validate'
const blacklistedKeys: BlacklistedKeys[] = ['validate', 'Field', 'fields', 'RowLabel']

// TODO: is there another way to do this within an existing loop? Need to explore.
// The problem is that functions/components cannot be sent through the client/server boundary.
export const prepareFields = (
  fields: FormState,
): {
  [key: string]: Omit<FormField, BlacklistedKeys>
} => {
  return Object.keys(fields).reduce(
    (acc, key) => {
      const newField = fields[key]

      blacklistedKeys.forEach((blacklistedKey) => {
        // set to` `undefined` or some other falsey value instead of delete for `mergeServerFormState` to work
        newField[blacklistedKey] = undefined
      })

      acc[key] = newField
      return acc
    },
    {} as {
      [key: string]: Omit<FormField, BlacklistedKeys>
    },
  )
}
