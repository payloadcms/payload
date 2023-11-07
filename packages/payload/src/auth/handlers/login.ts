import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'

import type { PayloadRequest } from '../../express/types'
import type { Result } from '../operations/login'

import login from '../operations/login'

export default async function loginHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<Response<Result & { message: string }> | void> {
  try {
    const result = await login({
      collection: req.collection,
      data: req.body,
      depth: parseInt(String(req.query.depth), 10),
      req,
      res,
    })

    res.status(httpStatus.OK).json({
      exp: result.exp,
      message: 'Auth Passed',
      token: result.token,
      user: result.user,
    })
  } catch (error) {
    next(error)
  }
}
