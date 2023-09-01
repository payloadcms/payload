import type { NextFunction, Response } from 'express'

import type { PayloadRequest } from '../../express/types'

import me from '../operations/me'

export default async function meHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<any> {
  try {
    const response = await me({
      collection: req.collection,
      req,
    })
    return res.status(200).json(response)
  } catch (err) {
    return next(err)
  }
}
