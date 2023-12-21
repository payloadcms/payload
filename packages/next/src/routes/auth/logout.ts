import httpStatus from 'http-status'
import { logoutOperation } from 'payload/operations'
import { PayloadRequest } from 'payload/types'
import { generateExpiredPayloadCookie } from '../../utilities/cookies'

// TODO(JARROD): pattern to catch errors and return correct Response
export const logout = async ({ req }: { req: PayloadRequest }): Promise<Response> => {
  const result = logoutOperation({
    collection: req.collection,
    req,
  })

  if (!result) {
    return Response.json(
      {
        message: 'Logout failed.',
      },
      {
        status: httpStatus.BAD_REQUEST,
      },
    )
  }

  const expiredCookie = generateExpiredPayloadCookie({
    collectionConfig: req.collection.config,
    payload: req.payload,
  })

  return Response.json(
    {
      message: 'Logout successful.',
    },
    {
      headers: new Headers({
        'Set-Cookie': expiredCookie,
      }),
      status: httpStatus.OK,
    },
  )
}
