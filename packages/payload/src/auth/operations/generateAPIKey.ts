import type { Collection } from '../../collections/config/types.js'
import type { JsonObject, PayloadRequest } from '../../types/index.js'

import { updateByIDOperation } from '../../collections/operations/updateByID.js'
import { combineQueries } from '../../database/combineQueries.js'
import { Forbidden, NotFound, ValidationError } from '../../errors/index.js'
import { fieldAffectsData } from '../../fields/config/types.js'
import { assertAPIKeyAssignment, generateAPIKey, withServerGeneratedAPIKey } from '../apiKeys.js'
import { executeAccess } from '../executeAccess.js'
import { hasWhereAccessResult } from '../types.js'

export const generateAPIKeyOperation = async ({
  id,
  collection,
  req,
  requestData,
}: {
  collection: Collection
  id: number | string
  req: PayloadRequest
  requestData: JsonObject
}): Promise<JsonObject> => {
  const generateIfMissing = requestData.generateIfMissing === true
  const apiKey = generateAPIKey()
  const data = { apiKey }
  const accessResult = await executeAccess(
    {
      id,
      slug: collection.config.slug,
      data,
      req,
    },
    collection.config.access.update,
  )

  assertAPIKeyAssignment({
    collection: collection.config,
    data: requestData,
    overrideAccess: false,
    req,
  })

  const { docs } = await req.payload.find({
    collection: collection.config.slug,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: combineQueries({ id: { equals: id } }, accessResult),
  })
  const doc = docs[0] as JsonObject | undefined

  if (!doc) {
    if (hasWhereAccessResult(accessResult)) {
      throw new Forbidden(req.t)
    }

    throw new NotFound(req.t)
  }

  const apiKeyField = collection.config.fields.find(
    (field) => fieldAffectsData(field) && field.name === 'apiKey',
  )

  if (apiKeyField && 'access' in apiKeyField && apiKeyField.access?.update) {
    const hasAccess = await apiKeyField.access.update({
      id,
      collection: collection.config,
      data,
      doc,
      req,
      siblingData: data,
    })

    if (!hasAccess) {
      throw new Forbidden(req.t)
    }
  }

  if (generateIfMissing && doc.apiKey) {
    return {}
  }

  if (!generateIfMissing && doc.enableAPIKey !== true) {
    throw new ValidationError(
      {
        id,
        collection: collection.config.slug,
        errors: [
          {
            message: 'API keys must be enabled before generating a new key.',
            path: 'enableAPIKey',
          },
        ],
        req,
      },
      req.t,
    )
  }

  return withServerGeneratedAPIKey(req, () =>
    updateByIDOperation({
      id,
      collection,
      data,
      overrideAccess: false,
      req,
    }),
  )
}
