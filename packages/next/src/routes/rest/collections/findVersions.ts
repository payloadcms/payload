import type { Where } from 'payload/types'

import httpStatus from 'http-status'
import { findVersionsOperation } from 'payload/operations'
import { corsHeaders, isNumber } from 'payload/utilities'

import type { CollectionRouteHandler } from '../types.js'

export const findVersions: CollectionRouteHandler = async ({ collection, req }) => {
  const { depth, limit, page, sort, where } = req.query as {
    depth?: string
    limit?: string
    page?: string
    sort?: string
    where?: Where
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
    headers: corsHeaders(req),
    status: httpStatus.OK,
  })
}
