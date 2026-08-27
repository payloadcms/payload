import type { FieldHook } from '../../../fields/config/types.js'

import { createKeyIndex } from './createKeyIndex.js'

/** Creates a hook that clears or recomputes the API-key lookup index from incoming document data. */
export const generateKeyIndex =
  ({ includeEnableAPIKey }: { includeEnableAPIKey: boolean }): FieldHook =>
  ({ data, req, value }) => {
    if (data?.apiKey === false || data?.apiKey === null || data?.apiKey === '') {
      return null
    }
    if (includeEnableAPIKey && (data?.enableAPIKey === false || data?.enableAPIKey === null)) {
      return null
    }
    if (data?.apiKey) {
      return createKeyIndex({ key: data.apiKey as string, secret: req.payload.secret })
    }
    return value
  }
