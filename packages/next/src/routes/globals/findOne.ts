import httpStatus from 'http-status'

import { findOneOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'
import { GlobalRouteHandler } from '../types'

export const findOne: GlobalRouteHandler = async ({ req, globalConfig }) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const result = await findOneOperation({
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: searchParams.get('draft') === 'true',
    globalConfig,
    req,
    slug: globalConfig.slug,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
