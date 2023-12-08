import type { NextFunction, Response } from 'express'

import { URL } from 'url'

import type { PayloadRequest } from '../../types'
import type { Document } from '../../types'

import { isNumber } from '../../utilities/isNumber'
import findVersionByID from '../operations/findVersionByID'

export type FindByIDResult = {
  doc: Document
  message: string
}

export default async function findVersionByIDHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<Response<FindByIDResult> | void> {
  const { searchParams } = new URL(req.url)
  const depth = searchParams.get('depth')

  const options = {
    id: req.params.id,
    collection: req.collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    payload: req.payload,
    req,
  }

  try {
    const doc = await findVersionByID(options)
    return res.json(doc)
  } catch (error) {
    return next(error)
  }
}
