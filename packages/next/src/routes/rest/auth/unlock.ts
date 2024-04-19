import httpStatus from 'http-status'
import { unlockOperation } from 'payload/operations'

import type { CollectionRouteHandler } from '../types.js'

export const unlock: CollectionRouteHandler = async ({ collection, req }) => {
  const { t } = req

  await unlockOperation({
    collection,
    data: { email: req.data.email as string },
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
