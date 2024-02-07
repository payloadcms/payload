import httpStatus from 'http-status'
import { logoutOperation } from 'payload/operations'
import { generateExpiredPayloadCookie } from '../../utilities/cookies'
import { CollectionRouteHandler } from '../types'

export const logout: CollectionRouteHandler = async ({ req, collection }) => {
  const result = logoutOperation({
    collection,
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
    collectionConfig: collection.config,
    payload: req.payload,
  })

  return Response.json(
    {
      // TODO(translate)
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
