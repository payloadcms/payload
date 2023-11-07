import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'

import type { PayloadRequest } from '../../express/types'

import resetPassword from '../operations/resetPassword'

async function resetPasswordHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<any> {
  try {
    const result = await resetPassword({
      collection: req.collection,
      data: req.body,
      req,
      res,
    })

    return res.status(httpStatus.OK).json({
      message: 'Password reset successfully.',
      token: result.token,
      user: result.user,
    })
  } catch (error) {
    return next(error)
  }
}

export default resetPasswordHandler
