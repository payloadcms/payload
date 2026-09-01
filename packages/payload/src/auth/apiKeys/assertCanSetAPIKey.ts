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
  const assignedAPIKeyField =
    collection.auth?.useAPIKey &&
    (['apiKey', 'apiKeyIndex'] as const).find(
      (field) => Object.prototype.hasOwnProperty.call(data, field) && data[field] !== undefined,
    )

  const canAssignAPIKey =
    (req.payloadAPI === 'local' && overrideAccess === true) || isServerGeneratedAPIKeyRequest(req)

  if (!assignedAPIKeyField || canAssignAPIKey) {
    return
  }

  throw new ValidationError(
    {
      collection: collection.slug,
      errors: [
        {
          message:
            'API key fields can only be assigned through the Local API when overrideAccess is enabled.',
          path: assignedAPIKeyField,
        },
      ],
      req,
    },
    req.t,
  )
}
