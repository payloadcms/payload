import type { Data, FormState } from '../admin/types.js'

import { unflatten as flatleyUnflatten } from './unflatten.js'

/**
 * Returns plain data from flattened form state (`FormState`).
 *
 * @param unflatten Unflattens the data and converts empty array and blocks row counts to arrays.
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

    if (ignoreDisableFormData === true || !field?.disableFormData) {
      data[key] =
        unflatten && !ignoreDisableFormData && field?.value === 0 && Array.isArray(field.rows)
          ? []
          : field?.value
    }
  })

  if (unflatten) {
    data = flatleyUnflatten(data)
  }

  return data
}
