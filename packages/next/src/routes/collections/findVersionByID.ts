import httpStatus from 'http-status'

import { PayloadRequest } from 'payload/types'
import { findVersionByIDOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'

export const findVersionByID = async ({
  req,
  id,
}: {
  req: PayloadRequest
  id: string
}): Promise<Response> => {
  const { searchParams } = new URL(req.url)
  const depth = searchParams.get('depth')

  const result = await findVersionByIDOperation({
    id,
    collection: req.collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    req,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
