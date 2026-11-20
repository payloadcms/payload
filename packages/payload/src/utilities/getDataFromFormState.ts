import type { Data, FormState } from '../admin/types.js'

import { unflatten as flatleyUnflatten } from './unflatten.js'

/**
 * Returns plain data from flattened form state (`FormState`).
 *
 * @param unflatten Unflattens the data and reconstructs array and blocks fields without numeric row counts.
 * @param ignoreDisableFormData Includes disabled fields and preserves raw row counts when true.
 *
 */
export const getDataFromFormState = (
  fields: FormState,
  unflatten?: boolean,
  ignoreDisableFormData?: boolean,
): Data => {
  let data: Record<string, any> = {}

  if (!fields) {
    return data
  }

  Object.keys(fields).forEach((key) => {
    const field = fields[key]

    if (unflatten && !ignoreDisableFormData) {
      for (let index = key.indexOf('.'); index !== -1; index = key.indexOf('.', index + 1)) {
        const ancestor = fields[key.substring(0, index)]

        // Cleared rows stay authoritative even when their own value is excluded from form data.
        if (Array.isArray(ancestor?.rows) && (ancestor.value === 0 || ancestor.value === null)) {
          return
        }
      }
    }

    if (ignoreDisableFormData === true || !field?.disableFormData) {
      if (
        unflatten &&
        !ignoreDisableFormData &&
        Array.isArray(field?.rows) &&
        typeof field.value === 'number'
      ) {
        if (field.value === 0) {
          data[key] = []
        }

        return
      }

      data[key] = field?.value
    }
  })

  if (unflatten) {
    data = flatleyUnflatten(data)
  }

  return data
}
