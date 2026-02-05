import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { parseParams } from '../../utilities/parseParams/index.js'
import { findRelatedDocuments } from '../operations/findRelatedDocuments.js'

/**
 * Endpoint to find all documents related to a taxonomy item
 * GET /api/{collection}/{id}/related
 */
export const findRelatedHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req)
  const { depth, limit, page } = parseParams(req.query)

  const result = await findRelatedDocuments({
    id,
    collection: collection.config,
    depth: depth || 0,
    limit: limit || 50,
    page: page || 1,
    req,
  })

  return Response.json(result, {
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status: httpStatus.OK,
  })
}
