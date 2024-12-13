import type { Where } from 'payload'

import httpStatus from 'http-status'
import { findVersionsOperationGlobal, sanitizePopulateParam, sanitizeSelectParam } from 'payload'
import { isNumber } from 'payload/shared'

import type { GlobalRouteHandler } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'

export const findVersions: GlobalRouteHandler = async ({ globalConfig, req }) => {
  const { depth, limit, page, pagination, populate, select, sort, where } = req.query as {
    depth?: string
    limit?: string
    page?: string
    pagination?: string
    populate?: Record<string, unknown>
    select?: Record<string, unknown>
    sort?: string
    where?: Where
  }

  const result = await findVersionsOperationGlobal({
    depth: isNumber(depth) ? Number(depth) : undefined,
    globalConfig,
    limit: isNumber(limit) ? Number(limit) : undefined,
    page: isNumber(page) ? Number(page) : undefined,
    pagination: pagination === 'false' ? false : undefined,
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
