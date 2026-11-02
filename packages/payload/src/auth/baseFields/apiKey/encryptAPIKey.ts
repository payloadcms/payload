import type { FieldHook } from '../../../fields/config/types.js'

/** Encrypts API keys before storage. */
export const encryptAPIKey: FieldHook = ({ data, req, value }) => {
  if (
    data &&
    'apiKey' in data &&
    typeof data.apiKey !== 'undefined' &&
    !(typeof data.apiKey === 'string' && data.apiKey)
  ) {
    return null
  }

  if (typeof value === 'undefined') {
    return undefined
  }

  return value ? req.payload.encrypt(value as string) : null
}
