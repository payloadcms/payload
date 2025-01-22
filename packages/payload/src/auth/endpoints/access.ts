import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { accessOperation } from '../operations/access.js'

export const accessHandler: PayloadHandler = async (req) => {
  try {
    const results = await accessOperation({
      req,
    })

    return Response.json(results, {
      status: httpStatus.OK,
    })
  } catch (e: unknown) {
    return Response.json(
      {
        error: e,
      },
      {
        status: httpStatus.INTERNAL_SERVER_ERROR,
      },
    )
  }
}
