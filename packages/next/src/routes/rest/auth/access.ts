import httpStatus from 'http-status'
import { accessOperation } from 'payload'

import type { BaseRouteHandler } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'

export const access: BaseRouteHandler = async ({ req }) => {
  const headers = headersWithCors({
    headers: new Headers(),
    req,
  })

  try {
    const results = await accessOperation({
      req,
    })

    return Response.json(results, {
      headers,
      status: httpStatus.OK,
    })
  } catch (e: unknown) {
    return Response.json(
      {
        error: e,
      },
      {
        headers,
        status: httpStatus.INTERNAL_SERVER_ERROR,
      },
    )
  }
}
