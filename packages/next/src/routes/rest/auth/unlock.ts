import httpStatus from 'http-status'
import { unlockOperation } from 'payload/operations'

import type { CollectionRouteHandler } from '../types.js'

export const unlock: CollectionRouteHandler = async ({ collection, req }) => {
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
