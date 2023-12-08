import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'
import { URL } from 'url'

import type { PayloadRequest } from '../../types'
import type { Document } from '../../types'
import type { SanitizedGlobalConfig } from '../config/types'

import formatSuccessResponse from '../../express/responses/formatSuccess'
import { isNumber } from '../../utilities/isNumber'
import restoreVersion from '../operations/restoreVersion'

export default function restoreVersionHandler(globalConfig: SanitizedGlobalConfig) {
  return async function handler(
    req: PayloadRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response<Document> | void> {
    const { searchParams } = new URL(req.url)
    const depth = searchParams.get('depth')

    const options = {
      id: req.params.id,
      depth: isNumber(depth) ? Number(depth) : undefined,
      globalConfig,
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
