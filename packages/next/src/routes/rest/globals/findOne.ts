import httpStatus from 'http-status'
import { findOneOperation } from 'payload'
import { isNumber } from 'payload/shared'

import type { GlobalRouteHandler } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'
import { sanitizeSelect } from '../utilities/sanitizeSelect.js'

export const findOne: GlobalRouteHandler = async ({ globalConfig, req }) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const result = await findOneOperation({
    slug: globalConfig.slug,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: searchParams.get('draft') === 'true',
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
