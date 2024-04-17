import httpStatus from 'http-status'
import { docAccessOperation } from 'payload/operations'
import { corsHeaders } from 'payload/utilities'

import type { CollectionRouteHandlerWithID } from '../types.js'

export const docAccess: CollectionRouteHandlerWithID = async ({ id, collection, req }) => {
  const result = await docAccessOperation({
    id,
    collection,
    req,
  })

  return Response.json(result, {
    headers: corsHeaders(req),
    status: httpStatus.OK,
  })
}
