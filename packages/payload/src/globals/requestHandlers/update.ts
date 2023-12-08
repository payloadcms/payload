import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'
import { URL } from 'url'

import type { PayloadRequest } from '../../types'
import type { Document } from '../../types'
import type { SanitizedGlobalConfig } from '../config/types'

import { isNumber } from '../../utilities/isNumber'
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
      const { searchParams } = new URL(req.url)
      const depth = searchParams.get('depth')
      const draft = searchParams.get('draft') === 'true'
      const autosave = searchParams.get('autosave') === 'true'

      const result = await update({
        autosave,
        data: req.body,
        depth: isNumber(depth) ? Number(depth) : undefined,
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
