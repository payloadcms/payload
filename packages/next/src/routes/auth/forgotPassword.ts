import { forgotPassword as forgotPasswordOperation } from 'payload/operations'
import { PayloadRequest } from 'payload/types'
import httpStatus from 'http-status'

// TODO(JARROD): pattern to catch errors and return correct Response
export const forgotPassword = async ({ req }: { req: PayloadRequest }): Promise<Response> => {
  await forgotPasswordOperation({
    collection: req.collection,
    data: {
      email: req.data.email as string,
    },
    disableEmail: Boolean(req.data?.disableEmail),
    expiration: typeof req.data.expiration === 'number' ? req.data.expiration : undefined,
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
