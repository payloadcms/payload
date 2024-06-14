import httpStatus from 'http-status'
import { extractJWT, generatePayloadCookie, refreshOperation } from 'payload'

import type { CollectionRouteHandler } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'

export const refresh: CollectionRouteHandler = async ({ collection, req }) => {
  const { t } = req
  const token = typeof req.data?.token === 'string' ? req.data.token : extractJWT(req)

  const headers = headersWithCors({
    headers: new Headers(),
    req,
  })

  if (!token) {
    return Response.json(
      {
        message: t('error:tokenNotProvided'),
      },
      {
        headers,
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

  headers.set('Set-Cookie', cookie)

  return Response.json(
    {
      message: t('authentication:tokenRefreshSuccessful'),
      ...result,
    },
    {
      headers,
      status: httpStatus.OK,
    },
  )
}
