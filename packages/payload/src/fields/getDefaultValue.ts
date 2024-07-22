import type { JsonObject, JsonValue, PayloadRequest } from '../types/index.js'

import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js'

type Args = {
  defaultValue: ((args: any) => JsonValue) | any
  locale: string | undefined
  user: PayloadRequest['user']
  value?: JsonValue
}

const getValueWithDefault = ({ defaultValue, locale, user, value }: Args): JsonValue => {
  if (typeof value !== 'undefined') {
    return value
  }

  if (defaultValue && typeof defaultValue === 'function') {
    return defaultValue({ locale, user })
  }

  if (typeof defaultValue === 'object') {
    return deepCopyObjectSimple(defaultValue)
  }

  return defaultValue
}

// eslint-disable-next-line no-restricted-exports
export default getValueWithDefault
