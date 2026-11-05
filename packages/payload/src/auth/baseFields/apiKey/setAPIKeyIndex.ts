import crypto from 'crypto'

import type { FieldHook } from '../../../fields/config/types.js'

/** Maintains the API key authentication index. */
export const setAPIKeyIndex: FieldHook = ({ data, req, siblingData }) => {
  if (
    data &&
    'apiKey' in data &&
    typeof data.apiKey !== 'undefined' &&
    !(typeof data.apiKey === 'string' && data.apiKey)
  ) {
    return null
  }

  if (typeof data?.apiKey === 'string') {
    return crypto.createHmac('sha256', req.payload.secret).update(data.apiKey).digest('hex')
  }

  delete siblingData.apiKeyIndex
}
