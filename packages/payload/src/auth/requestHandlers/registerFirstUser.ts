import type { NextFunction, Response } from 'express'

import type { PayloadRequest } from '../../express/types'

import registerFirstUser from '../operations/registerFirstUser'

export default async function registerFirstUserHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<any> {
  try {
    const firstUser = await registerFirstUser({
      collection: req.collection,
      data: req.body,
      req,
      res,
    })

    return res.status(201).json(firstUser)
  } catch (error) {
    return next(error)
  }
}
