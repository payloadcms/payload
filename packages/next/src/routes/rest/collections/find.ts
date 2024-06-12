import type { Where } from 'payload/bundle'

import httpStatus from 'http-status'
import { isNumber } from 'payload/bundle'
import { findOperation } from 'payload/server'

import type { CollectionRouteHandler } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'

export const find: CollectionRouteHandler = async ({ collection, req }) => {
  const { depth, draft, limit, page, sort, where } = req.query as {
    depth?: string
    draft?: string
    limit?: string
    page?: string
    sort?: string
    where?: Where
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
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status: httpStatus.OK,
  })
}
