import httpStatus from 'http-status'

import { unlockOperation } from 'payload/operations'
import { CollectionRouteHandler } from '../types'

export const unlock: CollectionRouteHandler = async ({ req, collection }) => {
  await unlockOperation({
    collection,
    data: { email: req.data.email as string },
    req,
  })

  return Response.json(
    {
      // TODO(translate)
      message: 'Success',
    },
    {
      status: httpStatus.OK,
    },
  )
}
