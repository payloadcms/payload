import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { JsonObject, PayloadRequest } from '../../types/index.js'

import { ValidationError } from '../../errors/index.js'
import { isServerGeneratedAPIKeyRequest } from './serverGeneratedAPIKeyRequest.js'

/** Prevents API key assignment outside trusted server and Local API requests. */
export const assertCanSetAPIKey = ({
  collection,
  data,
  overrideAccess,
  req,
}: {
  collection: SanitizedCollectionConfig
  data: JsonObject
  overrideAccess?: boolean
  req: PayloadRequest
}): void => {
  const isAPIKeyAssignment =
    collection.auth?.useAPIKey &&
    Object.prototype.hasOwnProperty.call(data, 'apiKey') &&
    data.apiKey !== undefined

  const canAssignAPIKey =
    (req.payloadAPI === 'local' && overrideAccess === true) || isServerGeneratedAPIKeyRequest(req)

  if (!isAPIKeyAssignment || canAssignAPIKey) {
    return
  }

  throw new ValidationError(
    {
      collection: collection.slug,
      errors: [
        {
          message:
            'API keys can only be assigned through the Local API when overrideAccess is enabled.',
          path: 'apiKey',
        },
      ],
      req,
    },
    req.t,
  )
}
