import type { JoinQuery, Where } from 'payload'

import httpStatus from 'http-status'
import {
  findOperation,
  sanitizeJoinParams,
  sanitizePopulateParam,
  sanitizeSelectParam,
} from 'payload'
import { isNumber } from 'payload/shared'

import type { CollectionRouteHandler } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'
export const find: CollectionRouteHandler = async ({ collection, req }) => {
  const { depth, draft, joins, limit, page, populate, select, sort, where } = req.query as {
    depth?: string
    draft?: string
    joins?: JoinQuery
    limit?: string
    page?: string
    populate?: Record<string, unknown>
    select?: Record<string, unknown>
    sort?: string
    where?: Where
  }

  const result = await findOperation({
    collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: draft === 'true',
    joins: sanitizeJoinParams(joins),
    limit: isNumber(limit) ? Number(limit) : undefined,
    page: isNumber(page) ? Number(page) : undefined,
    populate: sanitizePopulateParam(populate),
    req,
    select: sanitizeSelectParam(select),
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
