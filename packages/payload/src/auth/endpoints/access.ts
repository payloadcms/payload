import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { headersWithCors } from '../../utilities/headersWithCors.js'
import { accessOperation } from '../operations/access.js'

export const accessHandler: PayloadHandler = async (req) => {
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
