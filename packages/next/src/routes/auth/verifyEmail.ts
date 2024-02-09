import httpStatus from 'http-status'

import { verifyEmailOperation } from 'payload/operations'
import { CollectionRouteHandler } from '../types'

export const verifyEmail: CollectionRouteHandler<{ id: string }> = async ({
  req,
  id,
  collection,
}) => {
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
