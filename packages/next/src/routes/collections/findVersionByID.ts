import httpStatus from 'http-status'

import { PayloadRequest } from 'payload/types'
import { findVersionByID as findVersionByIdOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'

// TODO(JARROD): pattern to catch errors and return correct Response
export const findVersionByID = async ({
  req,
  id,
}: {
  req: PayloadRequest
  id: string
}): Promise<Response> => {
  const { searchParams } = new URL(req.url)
  const depth = searchParams.get('depth')

  const result = await findVersionByIdOperation({
    id,
    collection: req.collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    req,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
