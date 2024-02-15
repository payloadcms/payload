import httpStatus from 'http-status'

import type { Where } from 'payload/types'

import { findVersionsOperationGlobal } from 'payload/operations'
import { isNumber } from 'payload/utilities'
import { GlobalRouteHandler } from '../types'
import qs from 'qs'

export const findVersions: GlobalRouteHandler = async ({ req, globalConfig }) => {
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

  const result = await findVersionsOperationGlobal({
    depth: isNumber(depth) ? Number(depth) : undefined,
    globalConfig,
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
