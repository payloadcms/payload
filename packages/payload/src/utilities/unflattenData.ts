import type { JsonObject } from '../types/index.js'

import { unflatten } from './unflatten.js'

export const unflattenData = <T extends JsonObject>(data: T): T => {
  if (!data || typeof data !== 'object' || !Object.keys(data).some((key) => key.includes('.'))) {
    return data
  }

  const unflattened = unflatten(data) as JsonObject

  for (const key of Object.keys(data)) {
    delete data[key]
  }

  Object.assign(data, unflattened)

  return data
}
