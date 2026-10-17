import type { FormField, FormState } from 'payload'

import { setOwnProperty } from 'payload/shared'

type BlacklistedKeys = 'customComponents' | 'validate'
const blacklistedKeys: BlacklistedKeys[] = ['validate', 'customComponents']

const sanitizeField = (incomingField: FormField): FormField => {
  const field = { ...incomingField } // shallow copy, as we only need to remove top-level keys

  for (const key of blacklistedKeys) {
    delete field[key]
  }

  if (field.rows) {
    field.rows = field.rows.map(({ customComponents: _customComponents, ...row }) => row)
  }

  return field
}

/**
 * Takes in FormState and removes fields that are not serializable.
 * Returns FormState without blacklisted keys.
 */
export function reduceToSerializableFields(
  fields: FormState,
): Record<string, Omit<FormField, BlacklistedKeys>>
export function reduceToSerializableFields(
  fields?: false | FormState | null,
): Record<string, Omit<FormField, BlacklistedKeys>> | undefined
export function reduceToSerializableFields(
  fields?: false | FormState | null,
): Record<string, Omit<FormField, BlacklistedKeys>> | undefined {
  if (!fields) {
    return undefined
  }

  const result: Record<string, Omit<FormField, BlacklistedKeys>> = {}

  for (const key in fields) {
    setOwnProperty({ key, target: result, value: sanitizeField(fields[key]) })
  }

  return result
}
