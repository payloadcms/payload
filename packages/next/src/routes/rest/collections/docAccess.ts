import httpStatus from 'http-status'
import { docAccessOperation } from 'payload/operations'

import type { CollectionRouteHandlerWithID } from '../types.d.ts'

export const docAccess: CollectionRouteHandlerWithID = async ({ id, collection, req }) => {
  const result = await docAccessOperation({
    id,
    collection,
    req,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
