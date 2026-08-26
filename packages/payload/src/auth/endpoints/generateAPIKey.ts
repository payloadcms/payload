import { status as httpStatus } from 'http-status'

import type { Collection } from '../../collections/config/types.js'
import type { PayloadHandler } from '../../config/types.js'
import type { JsonObject, PayloadRequest } from '../../types/index.js'

import { updateByIDOperation } from '../../collections/operations/updateByID.js'
import { combineQueries } from '../../database/combineQueries.js'
import { APIError, Forbidden, NotFound, ValidationError } from '../../errors/index.js'
import { fieldAffectsData } from '../../fields/config/types.js'
import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { assertCanSetAPIKey } from '../apiKeys/assertCanSetAPIKey.js'
import { generateAPIKey } from '../apiKeys/generateAPIKey.js'
import { withServerGeneratedAPIKey } from '../apiKeys/serverGeneratedAPIKeyRequest.js'
import { executeAccess } from '../executeAccess.js'
import { hasWhereAccessResult } from '../types.js'

const generateAPIKeyForDocument = async ({
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

  assertCanSetAPIKey({
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

  if (doc.enableAPIKey !== true) {
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

export const generateAPIKeyHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req)

  if (!collection.config.auth?.useAPIKey) {
    throw new APIError('This collection does not use API keys.', httpStatus.NOT_FOUND)
  }

  const doc = await generateAPIKeyForDocument({ id, collection, req, requestData: req.data ?? {} })

  return Response.json(doc, {
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status: httpStatus.OK,
  })
}
