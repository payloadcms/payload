import type { Where } from 'payload'

import httpStatus from 'http-status'
import { findVersionsOperation } from 'payload'
import { isNumber } from 'payload/shared'

import type { CollectionRouteHandler } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'
import { sanitizeSelect } from '../utilities/sanitizeSelect.js'

export const findVersions: CollectionRouteHandler = async ({ collection, req }) => {
  const { depth, limit, page, select, sort, where } = req.query as {
    depth?: string
    limit?: string
    page?: string
    select?: Record<string, unknown>
    sort?: string
    where?: Where
  }

  const result = await findVersionsOperation({
    collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    limit: isNumber(limit) ? Number(limit) : undefined,
    page: isNumber(page) ? Number(page) : undefined,
    req,
    select: sanitizeSelect(select),
    sort: typeof sort === 'string' ? sort.split(',') : undefined,
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
