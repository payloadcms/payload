import httpStatus from 'http-status'

import type { PayloadRequest } from 'payload/types'

import { isNumber } from 'payload/utilities'
import { findOperation } from 'payload/operations'

// TODO(JARROD): pattern to catch errors and return correct Response
export const find = async ({ req }: { req: PayloadRequest }): Promise<Response> => {
  const { searchParams } = new URL(req.url)

  const depth = searchParams.get('depth')
  const limit = searchParams.get('limit')
  const page = searchParams.get('page')
  const where = searchParams.get('where')

  const result = await findOperation({
    collection: req.collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: searchParams.get('draft') === 'true',
    limit: isNumber(limit) ? Number(limit) : undefined,
    page: isNumber(page) ? Number(page) : undefined,
    req,
    sort: searchParams.get('sort'),
    where: where ? JSON.parse(where) : undefined,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
