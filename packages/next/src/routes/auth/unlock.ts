import httpStatus from 'http-status'

import { unlockOperation } from 'payload/operations'
import { PayloadRequest } from 'payload/types'

export const unlock = async ({ req }: { req: PayloadRequest }): Promise<Response> => {
  await unlockOperation({
    collection: req.collection,
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
