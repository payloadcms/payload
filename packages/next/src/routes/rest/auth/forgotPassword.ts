import httpStatus from 'http-status'
import { forgotPasswordOperation } from 'payload/operations'

import type { CollectionRouteHandler } from '../types'

export const forgotPassword: CollectionRouteHandler = async ({ collection, req }) => {
  await forgotPasswordOperation({
    collection,
    data: {
      email: req.data.email as string,
    },
    disableEmail: Boolean(req.data?.disableEmail),
    expiration: typeof req.data.expiration === 'number' ? req.data.expiration : undefined,
    req,
  })

  return Response.json(
    {
      // TODO(translate)
      message: 'Success',
    },
    {
      status: httpStatus.OK,
    },
  )
}
