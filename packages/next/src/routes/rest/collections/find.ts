import httpStatus from 'http-status'

import { isNumber } from 'payload/utilities'
import { findOperation } from 'payload/operations'
import { CollectionRouteHandler } from '../types'
import qs from 'qs'
import { Where } from 'payload/types'

export const find: CollectionRouteHandler = async ({ req, collection }) => {
  const { searchParams } = req

  // parse using `qs` to handle `where` queries
  const { where, page, depth, limit, sort, draft } = qs.parse(searchParams.toString()) as {
    where?: Where
    page?: string
    depth?: string
    limit?: string
    sort?: string
    draft?: string
  }

  const result = await findOperation({
    collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: draft === 'true',
    limit: isNumber(limit) ? Number(limit) : undefined,
    page: isNumber(page) ? Number(page) : undefined,
    req,
    sort,
    where,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
