import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'

import type { PayloadRequest } from '../../express/types.js'
import type { Document } from '../../types/index.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import formatSuccessResponse from '../../express/responses/formatSuccess.js'
import restoreVersion from '../operations/restoreVersion.js'

export default function restoreVersionHandler(globalConfig: SanitizedGlobalConfig) {
  return async function handler(
    req: PayloadRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response<Document> | void> {
    const options = {
      depth: Number(req.query.depth),
      globalConfig,
      id: req.params.id,
      req,
    }

    try {
      const doc = await restoreVersion(options)
      return res.status(httpStatus.OK).json({
        ...formatSuccessResponse(req.t('version:restoredSuccessfully'), 'message'),
        doc,
      })
    } catch (error) {
      return next(error)
    }
  }
}
