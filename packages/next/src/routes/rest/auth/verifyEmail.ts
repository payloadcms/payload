import httpStatus from 'http-status'
import { verifyEmailOperation } from 'payload/operations'
import { corsHeaders } from 'payload/utilities'

import type { CollectionRouteHandlerWithID } from '../types.js'

export const verifyEmail: CollectionRouteHandlerWithID = async ({ id, collection, req }) => {
  await verifyEmailOperation({
    collection,
    req,
    token: id,
  })

  return Response.json(
    {
      // TODO(translate)
      message: 'Email verified successfully.',
    },
    {
      headers: corsHeaders(req),
      status: httpStatus.OK,
    },
  )
}
