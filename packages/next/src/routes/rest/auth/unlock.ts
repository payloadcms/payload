import httpStatus from 'http-status'
import { unlockOperation } from 'payload'

import type { CollectionRouteHandler } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'

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
      headers: headersWithCors({
        headers: new Headers(),
        req,
      }),
      status: httpStatus.OK,
    },
  )
}
