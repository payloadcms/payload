import httpStatus from 'http-status'
import { verifyEmailOperation } from 'payload/operations'

import type { CollectionRouteHandlerWithID } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'

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
      headers: headersWithCors({
        headers: new Headers(),
        req,
      }),
      status: httpStatus.OK,
    },
  )
}
