import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'
import { URL } from 'url'

import type { PayloadRequest } from '../../types'
import type { Result } from '../operations/login'

import { isNumber } from '../../utilities/isNumber'
import login from '../operations/login'

export default async function loginHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<Response<Result & { message: string }> | void> {
  try {
    const searchParams = new URL(req.url).searchParams
    const depth = searchParams.get('depth')

    const result = await login({
      collection: req.collection,
      // TODO(JARROD): remove reliance on express body parsing
      data: req.body,
      depth: isNumber(depth) ? depth : undefined,
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
