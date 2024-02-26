import httpStatus from 'http-status'
import { verifyEmailOperation } from 'payload/operations'

import type { CollectionRouteHandlerWithID } from '../types'

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
      status: httpStatus.OK,
    },
  )
}
