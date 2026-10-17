import type { FormField, FormState } from 'payload'

import { setOwnProperty } from 'payload/shared'

type BlacklistedKeys = 'customComponents' | 'validate'
const blacklistedKeys: BlacklistedKeys[] = ['validate', 'customComponents']

const sanitizeField = (incomingField: FormField): FormField => {
  const field = { ...incomingField }

  for (const key of blacklistedKeys) {
    delete field[key]
  }

  if (field.rows) {
    field.rows = field.rows.map(({ customComponents: _customComponents, ...row }) => row)
  }

  return field
}

/**
 * Removes field and row components and field validators without changing field values.
 */
export const reduceToSerializableFields = (
  fields: FormState,
): {
  [key: string]: Omit<FormField, BlacklistedKeys>
} => {
  const result: Record<string, Omit<FormField, BlacklistedKeys>> = {}

  for (const key in fields) {
    setOwnProperty({ key, target: result, value: sanitizeField(fields[key]) })
  }

  return result
}
