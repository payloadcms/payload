import httpStatus from 'http-status'
import { docAccessOperationGlobal } from 'payload/operations'
import { corsHeaders } from 'payload/utilities'

import type { GlobalRouteHandler } from '../types.js'

export const docAccess: GlobalRouteHandler = async ({ globalConfig, req }) => {
  const result = await docAccessOperationGlobal({
    globalConfig,
    req,
  })

  return Response.json(result, {
    headers: corsHeaders(req),
    status: httpStatus.OK,
  })
}
