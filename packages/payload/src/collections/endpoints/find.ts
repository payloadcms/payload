// @ts-strict-ignore
import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'
import type { JoinQuery, Where } from '../../types/index.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { sanitizeJoinParams } from '../../utilities/sanitizeJoinParams.js'
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js'
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js'
import { findOperation } from '../operations/find.js'

export const findHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)
  const { depth, draft, joins, limit, page, pagination, populate, select, sort, where } =
    req.query as {
      depth?: string
      draft?: string
      joins?: JoinQuery
      limit?: string
      page?: string
      pagination?: string
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
