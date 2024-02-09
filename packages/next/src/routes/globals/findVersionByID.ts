import httpStatus from 'http-status'

import { findVersionByIDOperationGlobal } from 'payload/operations'
import { isNumber } from 'payload/utilities'
import { GlobalRouteHandlerWithID } from '../types'

export const findVersionByID: GlobalRouteHandlerWithID = async ({ req, globalConfig, id }) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const result = await findVersionByIDOperationGlobal({
    id,
    depth: isNumber(depth) ? Number(depth) : undefined,
    globalConfig,
    req,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
