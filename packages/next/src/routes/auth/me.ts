import httpStatus from 'http-status'
import type { PayloadRequest } from 'payload/types'
import { meOperation } from 'payload/operations'
import { extractJWT } from '../../utilities/jwt'

export const me = async ({ req }: { req: PayloadRequest }): Promise<Response> => {
  const currentToken = extractJWT(req)

  const result = await meOperation({
    collection: req.collection,
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
