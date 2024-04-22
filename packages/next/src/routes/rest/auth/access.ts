import httpStatus from 'http-status'
import { accessOperation } from 'payload/operations'

import type { BaseRouteHandler } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'

export const access: BaseRouteHandler = async ({ req }) => {
  const results = await accessOperation({
    req,
  })

  return Response.json(results, {
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status: httpStatus.OK,
  })
}
