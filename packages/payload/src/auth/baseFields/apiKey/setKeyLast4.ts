import type { FieldHook } from '../../../fields/config/types.js'

import { getAPIKeyLast4 } from './getAPIKeyLast4.js'

/** Maintains the non-secret API key preview. */
export const setKeyLast4: FieldHook = ({ data, siblingData }) => {
  if (
    data &&
    'apiKey' in data &&
    typeof data.apiKey !== 'undefined' &&
    !(typeof data.apiKey === 'string' && data.apiKey)
  ) {
    return null
  }

  if (typeof data?.apiKey === 'string') {
    return getAPIKeyLast4(data.apiKey)
  }

  delete siblingData.apiKeyLast4
}
