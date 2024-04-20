import httpStatus from 'http-status'
import { forgotPasswordOperation } from 'payload/operations'

import type { CollectionRouteHandler } from '../types.js'

export const forgotPassword: CollectionRouteHandler = async ({ collection, req }) => {
  const { t } = req
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
      message: t('general:success'),
    },
    {
      status: httpStatus.OK,
    },
  )
}
