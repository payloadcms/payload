import httpStatus from 'http-status'
import { extractJWT } from 'payload/auth'
import { generatePayloadCookie } from 'payload/auth'
import { refreshOperation } from 'payload/operations'
import { corsHeaders } from 'payload/utilities'

import type { CollectionRouteHandler } from '../types.js'

export const refresh: CollectionRouteHandler = async ({ collection, req }) => {
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
      // TODO(translate)
      message: 'Token refresh successful',
      ...result,
    },
    {
      headers: { ...corsHeaders(req), 'Set-Cookie': cookie },
      status: httpStatus.OK,
    },
  )
}
