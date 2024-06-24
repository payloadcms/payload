import httpStatus from 'http-status'
import { docAccessOperation } from 'payload'

import type { CollectionRouteHandlerWithID } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'

export const docAccess: CollectionRouteHandlerWithID = async ({ id, collection, req }) => {
  const result = await docAccessOperation({
    id,
    collection,
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
