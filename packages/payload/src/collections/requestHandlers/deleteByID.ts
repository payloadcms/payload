import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'
import { URL } from 'url'

import type { PayloadRequest } from '../../types'
import type { Document } from '../../types'

import { NotFound } from '../../errors'
import { isNumber } from '../../utilities/isNumber'
import deleteByID from '../operations/deleteByID'

export type DeleteResult = {
  doc: Document
  message: string
}

export default async function deleteByIDHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<Response<DeleteResult> | void> {
  try {
    const { searchParams } = new URL(req.url)
    const depth = searchParams.get('depth')
    const doc = await deleteByID({
      id: req.params.id,
      collection: req.collection,
      depth: isNumber(depth) ? depth : undefined,
      req,
    })

    if (!doc) {
      res.status(httpStatus.NOT_FOUND).json(new NotFound(req.t))
    }

    res.status(httpStatus.OK).send(doc)
  } catch (error) {
    next(error)
  }
}
