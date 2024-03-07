import type { Where } from 'payload/types'

import httpStatus from 'http-status'
import { findVersionsOperationGlobal } from 'payload/operations'
import { isNumber } from 'payload/utilities'
import qs from 'qs'

import type { GlobalRouteHandler } from '../types.d.ts'

export const findVersions: GlobalRouteHandler = async ({ globalConfig, req }) => {
  const { searchParams } = req

  // parse using `qs` to handle `where` queries
  const { depth, draft, limit, page, sort, where } = qs.parse(searchParams.toString()) as {
    depth?: string
    draft?: string
    limit?: string
    page?: string
    sort?: string
    where?: Where
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
