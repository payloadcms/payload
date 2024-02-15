import httpStatus from 'http-status'

import { Where } from 'payload/types'
import { findVersionsOperation } from 'payload/operations'
import { CollectionRouteHandler } from '../types'
import { isNumber } from 'payload/utilities'
import qs from 'qs'

export const findVersions: CollectionRouteHandler = async ({ req, collection }) => {
  const { searchParams } = req

  // parse using `qs` to handle `where` queries
  const { where, page, depth, limit, sort } = qs.parse(searchParams.toString()) as {
    where?: Where
    page?: string
    depth?: string
    limit?: string
    sort?: string
  }

  const result = await findVersionsOperation({
    collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
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
