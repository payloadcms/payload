import type { Data, FormState } from 'payload'

import { getDataFromFormState } from 'payload/shared'

type ReturnType = {
  data: Data
  valid: boolean
}

/**
 * Reduce flattened form fields (Fields) to just map to the respective values instead of the full FormField object
 *
 * @param unflatten This also unflattens the data if `unflatten` is true. The unflattened data should match the original data structure
 * @param ignoreDisableFormData Includes explicitly excluded fields and preserves raw row counts when true.
 *
 */
export const reduceFieldsToValuesWithValidation = (
  fields: FormState,
  unflatten?: boolean,
  ignoreDisableFormData?: boolean,
): ReturnType => {
  const state: ReturnType = {
    data: getDataFromFormState(fields, unflatten, ignoreDisableFormData),
    valid: true,
  }

  if (!fields) {
    return state
  }

  Object.keys(fields).forEach((key) => {
    if (ignoreDisableFormData === true || !fields[key]?.disableFormData) {
      if (!fields[key].valid) {
        state.valid = false
      }
    }
  })

  return state
}
