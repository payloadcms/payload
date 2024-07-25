import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'

import type { PayloadRequest } from '../../express/types'

import formatSuccessResponse from '../../express/responses/formatSuccess'
import { sanitizeCollectionID } from '../../utilities/sanitizeCollectionID'
import updateByID from '../operations/updateByID'

export type UpdateResult = {
  doc: Document
  message: string
}

export async function deprecatedUpdate(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<Response<UpdateResult> | void> {
  req.payload.logger.warn(
    'The PUT method is deprecated and will no longer be supported in a future release. Please use the PATCH method for update requests.',
  )

  return updateByIDHandler(req, res, next)
}

export default async function updateByIDHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<Response<UpdateResult> | void> {
  const id = sanitizeCollectionID({
    id: req.params.id,
    collectionSlug: req.collection.config.slug,
    payload: req.payload,
  })

  try {
    const draft = req.query.draft === 'true'
    const autosave = req.query.autosave === 'true'

    const doc = await updateByID({
      id,
      autosave,
      collection: req.collection,
      data: req.body,
      depth: parseInt(String(req.query.depth), 10),
      draft,
      req,
    })

    let message = req.t('general:updatedSuccessfully')

    if (draft) message = req.t('version:draftSavedSuccessfully')
    if (autosave) message = req.t('version:autosavedSuccessfully')

    res.status(httpStatus.OK).json({
      ...formatSuccessResponse(message, 'message'),
      doc,
    })
  } catch (error) {
    next(error)
  }
}
