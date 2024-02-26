import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'

import type { PayloadRequest } from '../../express/types'

import forgotPassword from '../operations/forgotPassword'

export default async function forgotPasswordHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<any> {
  try {
    await forgotPassword({
      collection: req.collection,
      data: { email: req.body.email },
      disableEmail: req.body.disableEmail,
      expiration: req.body.expiration,
      req,
    })

    return res.status(httpStatus.OK).json({
      message: 'Success',
    })
  } catch (error) {
    return next(error)
  }
}
