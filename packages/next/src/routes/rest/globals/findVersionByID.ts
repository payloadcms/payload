import httpStatus from 'http-status'
import { findVersionByIDOperationGlobal } from 'payload/operations'
import { corsHeaders, isNumber } from 'payload/utilities'

import type { GlobalRouteHandlerWithID } from '../types.js'

export const findVersionByID: GlobalRouteHandlerWithID = async ({ id, globalConfig, req }) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const result = await findVersionByIDOperationGlobal({
    id,
    depth: isNumber(depth) ? Number(depth) : undefined,
    globalConfig,
    req,
  })

  return Response.json(result, {
    headers: corsHeaders(req),
    status: httpStatus.OK,
  })
}
