import { type FormField, type FormState } from 'payload'

type BlacklistedKeys = 'customComponents' | 'validate'
const blacklistedKeys: BlacklistedKeys[] = ['validate', 'customComponents']

const sanitizeField = (incomingField: FormField): FormField => {
  const field = { ...incomingField } // shallow copy, as we only need to remove top-level keys

  for (const key of blacklistedKeys) {
    delete field[key]
  }

  return field
}

/**
 * Takes in FormState and removes fields that are not serializable.
 * Returns FormState without blacklisted keys.
 */
export const reduceToSerializableFields = (
  fields: FormState,
): {
  [key: string]: Omit<FormField, BlacklistedKeys>
} => {
  const result: Record<string, Omit<FormField, BlacklistedKeys>> = {}

  for (const key in fields) {
    result[key] = sanitizeField(fields[key])
  }

  return result
}
