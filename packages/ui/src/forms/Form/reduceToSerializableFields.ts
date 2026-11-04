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
 *
 * Removes custom components from rows as well as fields.
 * Converts upload `File` values and initial values in `file` to `{ name }` metadata.
 *
 * Returns a new state without mutating the source fields, rows, or upload files.
 * Returns `undefined` for falsy input.
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
    const field = sanitizeField(fields[key])

    if (key === 'file') {
      field.initialValue = getFileMetadata({ value: field.initialValue })
      field.value = getFileMetadata({ value: field.value })
    }

    setOwnProperty({ key, target: result, value: field })
  }

  return result
}

function getFileMetadata({ value }: { value: unknown }): unknown {
  // Validation needs the filename; the browser retains the bytes for submission and retries.
  return typeof File !== 'undefined' && value instanceof File ? { name: value.name } : value
}
