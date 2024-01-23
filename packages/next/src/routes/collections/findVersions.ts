import httpStatus from 'http-status'

import { PayloadRequest, Where } from 'payload/types'
import { findVersionsOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'

export const findVersions = async ({
  req,
  id,
}: {
  req: PayloadRequest
  id: string
}): Promise<Response> => {
  const { searchParams } = new URL(req.url)
  const page = searchParams.get('page')
  const depth = searchParams.get('depth')
  const limit = searchParams.get('limit')
  const where = searchParams.get('where')
  const sort = searchParams.get('sort')

  const result = await findVersionsOperation({
    collection: req.collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    limit: isNumber(limit) ? Number(limit) : undefined,
    page: isNumber(page) ? Number(page) : undefined,
    req,
    sort: sort,
    where: where ? (JSON.parse(where) as Where) : undefined,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
