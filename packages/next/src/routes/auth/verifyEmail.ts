import httpStatus from 'http-status'

import { verifyEmailOperation } from 'payload/operations'
import { PayloadRequest } from 'payload/types'

export const verifyEmail = async ({
  req,
  id,
}: {
  req: PayloadRequest
  id: string
}): Promise<Response> => {
  await verifyEmailOperation({
    collection: req.collection,
    req,
    token: id,
  })

  return Response.json(
    {
      // TODO(translate)
      message: 'Email verified successfully.',
    },
    {
      status: httpStatus.OK,
    },
  )
}
