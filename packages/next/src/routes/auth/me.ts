import httpStatus from 'http-status'
import type { PayloadRequest } from 'payload/types'
import { me as meOperation } from 'payload/operations'
import { extractJWT } from '../../utilities/jwt'

// TODO(JARROD): pattern to catch errors and return correct Response
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
      message: 'Successfully retrieved me user.',
    },
    {
      status: httpStatus.OK,
    },
  )
}
