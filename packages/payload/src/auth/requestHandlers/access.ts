import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'

import type { PayloadRequest } from '../../express/types.js'
import type { Permissions } from '../types.js'

import access from '../operations/access.js'

export default async function accessRequestHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<Response<Permissions> | void> {
  try {
    const accessResults = await access({
      req,
    })

    return res.status(httpStatus.OK).json(accessResults)
  } catch (error) {
    return next(error)
  }
}
