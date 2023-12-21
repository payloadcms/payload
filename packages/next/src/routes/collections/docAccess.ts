import httpStatus from 'http-status'

import type { PayloadRequest } from 'payload/types'

import { docAccessOperation } from 'payload/operations'

// TODO(JARROD): pattern to catch errors and return correct Response
export const docAccess = async ({
  req,
  id,
}: {
  req: PayloadRequest
  id: string
}): Promise<Response> => {
  const result = await docAccessOperation({
    id,
    req,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
