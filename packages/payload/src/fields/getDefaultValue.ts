import type { DefaultValue, JsonValue, PayloadRequest } from '../types/index.js'

import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js'

type Args = {
  defaultValue: DefaultValue
  locale: string | undefined
  req: PayloadRequest
  user: PayloadRequest['user']
  value?: JsonValue
}

export const getDefaultValue = async ({
  defaultValue,
  locale,
  req,
  user,
  value,
}: Args): Promise<JsonValue> => {
  if (typeof value !== 'undefined') {
    return value
  }

  if (defaultValue && typeof defaultValue === 'function') {
    return await defaultValue({ locale, req, user })
  }

  if (typeof defaultValue === 'object') {
    return deepCopyObjectSimple(defaultValue)
  }

  return defaultValue
}
