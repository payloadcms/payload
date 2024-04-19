import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'

import type { PayloadRequest } from '../../express/types'
import type { Document } from '../../types'

import formatSuccessResponse from '../../express/responses/formatSuccess'
import { sanitizeCollectionID } from '../../utilities/sanitizeCollectionID'
import restoreVersion from '../operations/restoreVersion'

export type RestoreResult = {
  doc: Document
  message: string
}

export default async function restoreVersionHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<Response<RestoreResult> | void> {
  const id = sanitizeCollectionID({
    id: req.params.id,
    collectionSlug: req.collection.config.slug,
    payload: req.payload,
  })

  const options = {
    id,
    collection: req.collection,
    depth: Number(req.query.depth),
    payload: req.payload,
    req,
  }

  try {
    const doc = await restoreVersion(options)
    res.status(httpStatus.OK).json({
      ...formatSuccessResponse(req.t('version:restoredSuccessfully'), 'message'),
      doc,
    })
  } catch (error) {
    next(error)
  }
}
