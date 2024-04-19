import httpStatus from 'http-status'
import { generateExpiredPayloadCookie } from 'payload/auth'
import { logoutOperation } from 'payload/operations'

import type { CollectionRouteHandler } from '../types.js'

export const logout: CollectionRouteHandler = async ({ collection, req }) => {
  const { t } = req
  const result = await logoutOperation({
    collection,
    req,
  })

  if (!result) {
    return Response.json(
      {
        message: t('error:logoutFailed'),
      },
      {
        status: httpStatus.BAD_REQUEST,
      },
    )
  }

  const expiredCookie = generateExpiredPayloadCookie({
    collectionConfig: collection.config,
    payload: req.payload,
  })

  return Response.json(
    {
      message: t('authentication:logoutSuccessful'),
    },
    {
      headers: new Headers({
        'Set-Cookie': expiredCookie,
      }),
      status: httpStatus.OK,
    },
  )
}
