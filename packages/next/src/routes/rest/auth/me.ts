import httpStatus from 'http-status'
import { extractJWT } from 'payload/auth'
import { meOperation } from 'payload/operations'

import type { CollectionRouteHandler } from '../types'

export const me: CollectionRouteHandler = async ({ collection, req }) => {
  const currentToken = extractJWT(req)

  const result = await meOperation({
    collection,
    currentToken,
    req,
  })

  if (collection.config.auth.removeTokenFromResponses) {
    delete result.token
  }

  return Response.json(
    {
      ...result,
      message: req.t('authentication:account'),
    },
    {
      status: httpStatus.OK,
    },
  )
}
