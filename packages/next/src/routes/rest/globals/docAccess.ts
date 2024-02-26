import httpStatus from 'http-status'
import { docAccessOperationGlobal } from 'payload/operations'

import type { GlobalRouteHandler } from '../types'

export const docAccess: GlobalRouteHandler = async ({ globalConfig, req }) => {
  const result = await docAccessOperationGlobal({
    globalConfig,
    req,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
