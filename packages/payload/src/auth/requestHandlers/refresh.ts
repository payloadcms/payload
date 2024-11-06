import type { NextFunction, Response } from 'express'

import type { PayloadRequest } from '../../express/types'

import refresh from '../operations/refresh'

export default async function refreshHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<any> {
  try {
    const result = await refresh({
      collection: req.collection,
      req,
      res,
    })

    return res.status(200).json({
      message: 'Token refresh successful',
      ...result,
    })
  } catch (error) {
    return next(error)
  }
}
