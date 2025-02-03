import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'
import type { Where } from '../../types/index.js'

import { getRequestGlobal } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js'
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js'
import { findVersionsOperation } from '../operations/findVersions.js'

export const findVersionsHandler: PayloadHandler = async (req) => {
  const globalConfig = getRequestGlobal(req)
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

  const result = await findVersionsOperation({
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
