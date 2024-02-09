import httpStatus from 'http-status'

import { docAccessOperation } from 'payload/operations'
import { CollectionRouteHandler } from '../types'

export const docAccess: CollectionRouteHandler<{ id: string }> = async ({
  req,
  id,
  collection,
}) => {
  const result = await docAccessOperation({
    id,
    req,
    collection,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
