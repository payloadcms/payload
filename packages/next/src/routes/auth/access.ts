import httpStatus from 'http-status'
import { accessOperation } from 'payload/operations'
import { PayloadRequest } from 'payload/types'

// TODO(JARROD): pattern to catch errors and return correct Response
export const access = async ({ req }: { req: PayloadRequest }): Promise<Response> => {
  const results = await accessOperation({
    req,
  })

  return Response.json(results, {
    status: httpStatus.OK,
  })
}
