import httpStatus from 'http-status'

import { docAccessOperation } from 'payload/operations'
import { CollectionRouteHandlerWithID } from '../types'

export const docAccess: CollectionRouteHandlerWithID = async ({ req, id, collection }) => {
  const result = await docAccessOperation({
    id,
    req,
    collection,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
