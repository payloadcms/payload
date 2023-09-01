import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'

import type { PayloadRequest } from '../../express/types'

import unlock from '../operations/unlock'

export default async function unlockHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<any> {
  try {
    await unlock({
      collection: req.collection,
      data: { email: req.body.email },
      req,
    })

    return res.status(httpStatus.OK).json({
      message: 'Success',
    })
  } catch (error) {
    return next(error)
  }
}
