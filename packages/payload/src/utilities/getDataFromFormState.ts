import type { Data, FormState } from '../admin/types.js'

import { unflatten as flatleyUnflatten } from './unflatten.js'

/**
 * Returns plain data from flattened form state (`FormState`).
 *
 * @param unflatten Unflattens the field values into nested data when true.
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
    if (ignoreDisableFormData === true || !fields[key]?.disableFormData) {
      data[key] = fields[key]?.value
    }
  })

  if (unflatten) {
    data = flatleyUnflatten(data)
  }

  return data
}
