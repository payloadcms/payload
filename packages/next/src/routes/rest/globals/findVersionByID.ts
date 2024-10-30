import httpStatus from 'http-status'
import { findVersionByIDOperationGlobal } from 'payload'
import { isNumber } from 'payload/shared'

import type { GlobalRouteHandlerWithID } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'
import { sanitizeSelect } from '../utilities/sanitizeSelect.js'

export const findVersionByID: GlobalRouteHandlerWithID = async ({ id, globalConfig, req }) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const result = await findVersionByIDOperationGlobal({
    id,
    depth: isNumber(depth) ? Number(depth) : undefined,
    globalConfig,
    req,
    select: sanitizeSelect(req.query.select),
  })

  return Response.json(result, {
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status: httpStatus.OK,
  })
}
