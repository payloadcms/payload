import type { JsonValue, PayloadRequest } from '../types/index.js'

import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js'

type Args = {
  defaultValue: ((args: any) => JsonValue) | any
  locale: string | undefined
  user: PayloadRequest['user']
  value?: JsonValue
}

export const getDefaultValue = async ({
  defaultValue,
  locale,
  user,
  value,
}: Args): Promise<JsonValue> => {
  if (typeof value !== 'undefined') {
    return value
  }

  if (defaultValue && typeof defaultValue === 'function') {
    return await defaultValue({ locale, user })
  }

  if (typeof defaultValue === 'object') {
    return deepCopyObjectSimple(defaultValue)
  }

  return defaultValue
}
