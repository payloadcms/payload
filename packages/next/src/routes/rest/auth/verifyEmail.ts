import httpStatus from 'http-status'
import { verifyEmailOperation } from 'payload/operations'

import type { CollectionRouteHandlerWithID } from '../types.js'

export const verifyEmail: CollectionRouteHandlerWithID = async ({ id, collection, req }) => {
  const { t } = req
  await verifyEmailOperation({
    collection,
    req,
    token: id,
  })

  return Response.json(
    {
      message: t('authentication:emailVerified'),
    },
    {
      status: httpStatus.OK,
    },
  )
}
