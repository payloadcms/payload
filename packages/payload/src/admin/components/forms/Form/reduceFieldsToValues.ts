import { unflatten as flatleyUnflatten } from 'flatley'

import type { Data, Fields } from './types'

const reduceFieldsToValues = (
  fields: Fields,
  unflatten?: boolean,
  ignoreDisableFormData?: boolean,
): Data => {
  const data = {}

  Object.keys(fields).forEach((key) => {
    if (ignoreDisableFormData === true || !fields[key].disableFormData) {
      data[key] = fields[key].value
    }
  })

  if (unflatten) {
    return flatleyUnflatten(data, { safe: true })
  }

  return data
}

export default reduceFieldsToValues
