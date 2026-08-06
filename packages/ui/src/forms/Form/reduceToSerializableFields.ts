import { type FormField, type FormState, type Row } from 'payload'

type BlacklistedKeys = 'customComponents' | 'validate'
const blacklistedKeys: BlacklistedKeys[] = ['validate', 'customComponents']

const sanitizeRow = (incomingRow: Row): Row => {
  const row = { ...incomingRow }

  delete row.customComponents

  return row
}

const sanitizeField = (incomingField: FormField): FormField => {
  const field = { ...incomingField }

  for (const key of blacklistedKeys) {
    delete field[key]
  }

  if (field.rows) {
    field.rows = field.rows.map(sanitizeRow)
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
