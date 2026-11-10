import type { FormState } from '../admin/types.js'

import { getDataFromFormState } from './getDataFromFormState.js'

export const getDataByPath = <T = unknown>(fields: FormState, path: string): T => {
  const pathPrefixToRemove = path.substring(0, path.lastIndexOf('.') + 1)
  const name = path.split('.').pop()

  const fieldsAtPath: FormState = {}

  Object.entries(fields).forEach(([key, field]) => {
    if (key.indexOf(`${path}.`) === 0 || key === path) {
      fieldsAtPath[key.replace(pathPrefixToRemove, '')] = field
    }
  })

  const unflattenedData = getDataFromFormState(fieldsAtPath, true)

  return unflattenedData?.[name!]
}
