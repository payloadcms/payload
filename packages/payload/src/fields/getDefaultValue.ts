import type { PayloadRequestWithData } from '../types/index.js'

import { deepCopyObject } from '../utilities/deepCopyObject.js'

type Args = {
  defaultValue: unknown
  locale: string | undefined
  user: PayloadRequestWithData['user']
  value?: unknown
}

const getValueWithDefault = ({ defaultValue, locale, user, value }: Args): unknown => {
  if (typeof value !== 'undefined') {
    return value
  }

  if (defaultValue && typeof defaultValue === 'function') {
    return defaultValue({ locale, user })
  }

  if (typeof defaultValue === 'object') {
    return deepCopyObject(defaultValue)
  }

  return defaultValue
}

// eslint-disable-next-line no-restricted-exports
export default getValueWithDefault
