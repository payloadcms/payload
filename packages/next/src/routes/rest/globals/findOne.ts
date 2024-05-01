import type { Populate, Select } from 'payload/types'

import httpStatus from 'http-status'
import { findOneOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'

import type { GlobalRouteHandler } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'

export const findOne: GlobalRouteHandler = async ({ globalConfig, req }) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const { populate, select } = req.query as {
    populate?: Populate
    select?: Select
  }

  const result = await findOneOperation({
    slug: globalConfig.slug,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: searchParams.get('draft') === 'true',
    globalConfig,
    populate,
    req,
    select,
  })

  return Response.json(result, {
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status: httpStatus.OK,
  })
}
