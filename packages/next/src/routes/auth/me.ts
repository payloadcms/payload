import httpStatus from 'http-status'
import { meOperation } from 'payload/operations'
import { extractJWT } from '../../utilities/jwt'
import { CollectionRouteHandler } from '../types'

export const me: CollectionRouteHandler = async ({ req, collection }) => {
  const currentToken = extractJWT(req)

  const result = await meOperation({
    collection,
    req,
    currentToken,
  })

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
