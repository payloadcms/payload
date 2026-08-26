import crypto from 'crypto'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'

import { ValidationError } from '../errors/index.js'

const serverGeneratedAPIKeyRequests = new WeakSet<PayloadRequest>()

export const generateAPIKey = (): string => crypto.randomUUID()

export const isServerGeneratedAPIKeyRequest = (req: PayloadRequest): boolean =>
  serverGeneratedAPIKeyRequests.has(req)

export const withServerGeneratedAPIKey = async <T>(
  req: PayloadRequest,
  callback: () => Promise<T>,
): Promise<T> => {
  serverGeneratedAPIKeyRequests.add(req)

  try {
    return await callback()
  } finally {
    serverGeneratedAPIKeyRequests.delete(req)
  }
}

export const assertAPIKeyAssignment = ({
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
  if (
    !collection.auth?.useAPIKey ||
    !Object.prototype.hasOwnProperty.call(data, 'apiKey') ||
    data.apiKey === null ||
    data.apiKey === undefined
  ) {
    return
  }

  if (
    (req.payloadAPI === 'local' && overrideAccess === true) ||
    isServerGeneratedAPIKeyRequest(req)
  ) {
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
