import { unflatten } from 'flatley'

import type { Fields } from './types'

const getDataByPath = <T = unknown>(fields: Fields, path: string): T => {
  const pathPrefixToRemove = path.substring(0, path.lastIndexOf('.') + 1)
  const name = path.split('.').pop()

  let fieldHasEmptyRows = false

  const data = {}
  Object.keys(fields).forEach((key) => {
    if (!fields[key].disableFormData && (key.indexOf(`${path}.`) === 0 || key === path)) {
      data[key.replace(pathPrefixToRemove, '')] = fields[key].value

      if (fields[key].rows && fields[key].rows.length === 0) {
        fieldHasEmptyRows = true
      }
    }
  })

  const unflattenedData = unflatten(data)

  if (fieldHasEmptyRows) {
    return [] as T
  }

  return unflattenedData?.[name]
}

export default getDataByPath
