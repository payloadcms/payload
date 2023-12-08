import type { NextFunction, Response } from 'express'

import type { PayloadRequest } from '../../types'

import { extractJWT } from '../getExtractJWT'
import refresh from '../operations/refresh'

export default async function refreshHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<any> {
  try {
    let token

    token = extractJWT(req)

    if (req.body) {
      token = req.body.data
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
