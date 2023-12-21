import httpStatus from 'http-status'

import { PayloadRequest } from 'payload/types'
import { findByID as findByIdOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'

// TODO(JARROD): pattern to catch errors and return correct Response
export const findByID = async ({
  req,
  id,
}: {
  req: PayloadRequest
  id: string
}): Promise<Response> => {
  const { searchParams } = new URL(req.url)
  const depth = searchParams.get('depth')

  const result = await findByIdOperation({
    id,
    collection: req.collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: searchParams.get('draft') === 'true',
    req,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
