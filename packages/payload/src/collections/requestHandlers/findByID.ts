import type { NextFunction, Response } from 'express'

import type { PayloadRequest } from '../../express/types'
import type { Document } from '../../types'

import findByID from '../operations/findByID'

export type FindByIDResult = {
  doc: Document
  message: string
}

export default async function findByIDHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<Response<FindByIDResult> | void> {
  try {
    const doc = await findByID({
      collection: req.collection,
      depth: Number(req.query.depth),
      draft: req.query.draft === 'true',
      id: req.params.id,
      req,
    })
    return res.json(doc)
  } catch (error) {
    return next(error)
  }
}
