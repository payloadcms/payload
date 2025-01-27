import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'

import type { PayloadRequest } from '../../express/types'
import type { Where } from '../../types'

import count from '../operations/count'

export default async function countHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<Response<{ totalDocs: number }> | void> {
  try {
    const result = await count({
      collection: req.collection,
      req,
      where: req.query.where as Where, // This is a little shady
    })

    return res.status(httpStatus.OK).json(result)
  } catch (error) {
    return next(error)
  }
}
