import { extractJWT } from 'payload/auth'
import { refreshOperation } from 'payload/operations'
import httpStatus from 'http-status'
import { generatePayloadCookie } from 'payload/auth'
import { CollectionRouteHandler } from '../types'

export const refresh: CollectionRouteHandler = async ({ req, collection }) => {
  const token = typeof req.data?.token === 'string' ? req.data.token : extractJWT(req)

  if (!token) {
    return Response.json(
      {
        // TODO(translate)
        message: 'Token not provided.',
      },
      {
        status: httpStatus.UNAUTHORIZED,
      },
    )
  }

  const result = await refreshOperation({
    token,
    req,
    collection,
  })

  const cookie = generatePayloadCookie({
    token: result.refreshedToken,
    payload: req.payload,
    collectionConfig: collection.config,
  })

  if (collection.config.auth.removeTokenFromResponses) {
    delete result.refreshedToken
  }

  return Response.json(
    {
      // TODO(translate)
      message: 'Token refresh successful',
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
