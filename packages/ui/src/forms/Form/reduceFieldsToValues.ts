import { unflatten as flatleyUnflatten } from 'flatley'

import type { FormState } from './types'
import { Data } from 'payload/types'

const reduceFieldsToValues = (fields: FormState, unflatten?: boolean): Data => {
  const data = {}

  Object.keys(fields).forEach((key) => {
    if (fields && key in fields && !fields[key]?.disableFormData) {
      data[key] = fields[key].value
    }
  })

  if (unflatten) {
    return flatleyUnflatten(data, { safe: true })
  }

  return data
}

export default reduceFieldsToValues
