import crypto from 'crypto'

import type { FieldHook } from '../../../fields/config/types.js'

/** Maintains the API key authentication index. */
export const setAPIKeyIndex: FieldHook = ({ data, originalDoc, req, siblingData }) => {
  if (
    data &&
    'apiKey' in data &&
    typeof data.apiKey !== 'undefined' &&
    !(typeof data.apiKey === 'string' && data.apiKey)
  ) {
    return null
  }

  // Checking `enableAPIKey` here is for backward compatibility only and will be removed in v4.
  const isDisablingAPIKey = data?.enableAPIKey === false && originalDoc?.enableAPIKey !== false

  if (isDisablingAPIKey && !(typeof data.apiKey === 'string' && data.apiKey)) {
    return null
  }

  if (data?.apiKey) {
    return crypto
      .createHmac('sha256', req.payload.secret)
      .update(data.apiKey as string)
      .digest('hex')
  }

  delete siblingData.apiKeyIndex
}
