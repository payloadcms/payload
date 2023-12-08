import type { NextFunction, Response } from 'express'

import type { PayloadRequest } from '../../types'

import registerFirstUser from '../operations/registerFirstUser'

export default async function registerFirstUserHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<any> {
  try {
    const firstUser = await registerFirstUser({
      collection: req.collection,
      // TODO(JARROD): remove reliance on express body parsing
      data: req.body,
      req,
      res,
    })

    return res.status(201).json(firstUser)
  } catch (error) {
    return next(error)
  }
}
