import type { FormField, FormState } from 'payload'

type BlacklistedKeys = 'validate'
const blacklistedKeys: BlacklistedKeys[] = ['validate']

// TODO: is there another way to do this within an existing loop? Need to explore.
// The problem is that functions/components cannot cross the client->server boundary
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
  keepSchemaIndexes: boolean = false,
): {
  [key: string]: Omit<FormField, BlacklistedKeys>
} => {
  return Object.keys(fields).reduce(
    (acc, key) => {
      const newField = sanitizeField(fields[key])

      if (keepSchemaIndexes) {
        acc[key] = newField
        return acc
      }

      /**
       * Remove all _index- schema indexes from the form state keys, as they represent fields
       * that do not affect data and are not processed by the server
       */
      const keySplit = key.split('.')
      const newKeyArray = []
      for (const keyPart of keySplit) {
        if (!keyPart.startsWith('_index-')) {
          newKeyArray.push(keyPart)
        }
      }

      if (newKeyArray.length > 0) {
        acc[newKeyArray.join('.')] = newField
      }

      return acc
    },
    {} as {
      [key: string]: Omit<FormField, BlacklistedKeys>
    },
  )
}
