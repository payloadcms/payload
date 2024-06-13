import httpStatus from 'http-status'
import { forgotPasswordOperation } from 'payload'

import type { CollectionRouteHandler } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'

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
      headers: headersWithCors({
        headers: new Headers(),
        req,
      }),
      status: httpStatus.OK,
    },
  )
}
