import httpStatus from 'http-status'
import { unlockOperation } from 'payload'

import type { CollectionRouteHandler } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'

export const unlock: CollectionRouteHandler = async ({ collection, req }) => {
  const { t } = req

  const authData = collection.config.auth?.loginWithUsername
    ? {
        email: typeof req.data?.email === 'string' ? req.data.email : '',
        username: typeof req.data?.username === 'string' ? req.data.username : '',
      }
    : {
        email: typeof req.data?.email === 'string' ? req.data.email : '',
      }

  await unlockOperation({
    collection,
    data: authData,
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
