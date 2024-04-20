import httpStatus from 'http-status'
import { extractJWT } from 'payload/auth'
import { generatePayloadCookie } from 'payload/auth'
import { refreshOperation } from 'payload/operations'

import type { CollectionRouteHandler } from '../types.js'

export const refresh: CollectionRouteHandler = async ({ collection, req }) => {
  const { t } = req
  const token = typeof req.data?.token === 'string' ? req.data.token : extractJWT(req)

  if (!token) {
    return Response.json(
      {
        message: t('error:tokenNotProvided'),
      },
      {
        status: httpStatus.UNAUTHORIZED,
      },
    )
  }

  const result = await refreshOperation({
    collection,
    req,
    token,
  })

  const cookie = generatePayloadCookie({
    collectionConfig: collection.config,
    payload: req.payload,
    token: result.refreshedToken,
  })

  if (collection.config.auth.removeTokenFromResponses) {
    delete result.refreshedToken
  }

  return Response.json(
    {
      message: t('authentication:tokenRefreshSuccessful'),
      ...result,
    },
    {
      headers: new Headers({
        'Set-Cookie': cookie,
      }),
      status: httpStatus.OK,
    },
  )
}
