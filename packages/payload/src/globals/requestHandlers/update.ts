import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'

import type { PayloadRequest } from '../../express/types'
import type { Document } from '../../types'
import type { SanitizedGlobalConfig } from '../config/types'

import update from '../operations/update'

export type UpdateGlobalResult = Promise<Response<Document> | void>
export type UpdateGlobalResponse = (
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
) => UpdateGlobalResult

export default function updateHandler(globalConfig: SanitizedGlobalConfig): UpdateGlobalResponse {
  return async function handler(req: PayloadRequest, res: Response, next: NextFunction) {
    try {
      const { slug } = globalConfig
      const draft = req.query.draft === 'true'
      const autosave = req.query.autosave === 'true'

      const result = await update({
        autosave,
        data: req.body,
        depth: Number(req.query.depth),
        draft,
        globalConfig,
        req,
        slug,
      })

      let message = req.t('general:updatedSuccessfully')

      if (draft) message = req.t('version:draftSavedSuccessfully')
      if (autosave) message = req.t('version:autosavedSuccessfully')

      res.status(httpStatus.OK).json({ message, result })
    } catch (error) {
      next(error)
    }
  }
}
