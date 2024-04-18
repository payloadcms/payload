import type { PayloadRequest } from '../types/index.js'

import { deepCopyObject } from '../utilities/deepCopyObject.js'

type Args = {
  defaultValue: unknown
  req: PayloadRequest
  value?: unknown
}

const getValueWithDefault = ({ defaultValue, req, value }: Args): unknown => {
  if (typeof value !== 'undefined') {
    return value
  }

  if (defaultValue && typeof defaultValue === 'function') {
    return defaultValue(req)
  }

  if (typeof defaultValue === 'object') {
    return deepCopyObject(defaultValue)
  }

  return defaultValue
}

// eslint-disable-next-line no-restricted-exports
export default getValueWithDefault
