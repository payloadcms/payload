import httpStatus from 'http-status'

import { docAccessOperationGlobal } from 'payload/operations'
import { GlobalRouteHandler } from '../types'

export const docAccess: GlobalRouteHandler = async ({ req, globalConfig }) => {
  const result = await docAccessOperationGlobal({
    globalConfig,
    req,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
