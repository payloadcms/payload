import { extractJWT } from '../../utilities/jwt'
import { refreshOperation } from 'payload/operations'
import { PayloadRequest } from 'payload/types'
import httpStatus from 'http-status'
import { generatePayloadCookie } from '../../utilities/cookies'

export const refresh = async ({ req }: { req: PayloadRequest }): Promise<Response> => {
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
    collection: req.collection,
  })

  const cookie = generatePayloadCookie({
    token: result.refreshedToken,
    payload: req.payload,
    collectionConfig: req.collection.config,
  })

  return Response.json(
    {
      exp: result.exp,
      // TODO(translate)
      message: 'Token refresh successful',
      token: result.refreshedToken,
      user: result.user,
    },
    {
      headers: new Headers({
        'Set-Cookie': cookie,
      }),
      status: httpStatus.OK,
    },
  )
}
