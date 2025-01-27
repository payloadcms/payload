import type { Fields } from './types'

import { unflatten } from '../../../utilities/unflatten'

const getDataByPath = <T = unknown>(fields: Fields, path: string): T => {
  const pathPrefixToRemove = path.substring(0, path.lastIndexOf('.') + 1)
  const name = path.split('.').pop()

  const data = {}
  Object.keys(fields).forEach((key) => {
    if (!fields[key].disableFormData && (key.indexOf(`${path}.`) === 0 || key === path)) {
      data[key.replace(pathPrefixToRemove, '')] = fields[key].value

      if (fields[key]?.rows && fields[key].rows.length === 0) {
        data[key.replace(pathPrefixToRemove, '')] = []
      }
    }
  })

  const unflattenedData = unflatten(data)

  return unflattenedData?.[name]
}

export default getDataByPath
