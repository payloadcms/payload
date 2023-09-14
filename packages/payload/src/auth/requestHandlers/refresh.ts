import type { NextFunction, Response } from 'express'

import type { PayloadRequest } from '../../express/types'

import getExtractJWT from '../getExtractJWT'
import refresh from '../operations/refresh'

export default async function refreshHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<any> {
  try {
    let token

    const extractJWT = getExtractJWT(req.payload.config)
    token = extractJWT(req)

    if (req.body.token) {
      token = req.body.token
    }

    const result = await refresh({
      collection: req.collection,
      req,
      res,
      token,
    })

    return res.status(200).json({
      message: 'Token refresh successful',
      ...result,
    })
  } catch (error) {
    return next(error)
  }
}
