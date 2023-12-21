import httpStatus from 'http-status'

import { unlock as unlockOperation } from 'payload/operations'
import { PayloadRequest } from 'payload/types'

// TODO(JARROD): pattern to catch errors and return correct Response
export const unlock = async ({ req }: { req: PayloadRequest }): Promise<Response> => {
  await unlockOperation({
    collection: req.collection,
    data: { email: req.data.email as string },
    req,
  })

  return Response.json(
    {
      message: 'Success',
    },
    {
      status: httpStatus.OK,
    },
  )
}
