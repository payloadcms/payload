import type { NextFunction, Response } from 'express'

import { URL } from 'url'

import type { PayloadRequest } from '../../types'
import type { Document } from '../../types'

import { isNumber } from '../../utilities/isNumber'
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
    const { searchParams } = new URL(req.url)
    const depth = searchParams.get('depth')

    const doc = await findByID({
      id: req.params.id,
      collection: req.collection,
      depth: isNumber(depth) ? Number(depth) : undefined,
      draft: searchParams.get('draft') === 'true',
      req,
    })
    return res.json(doc)
  } catch (error) {
    return next(error)
  }
}
