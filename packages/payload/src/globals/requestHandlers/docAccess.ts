import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'

import type { CollectionPermission, GlobalPermission } from '../../auth'
import type { PayloadRequest } from '../../express/types'
import type { SanitizedGlobalConfig } from '../config/types'

import { docAccess } from '../operations/docAccess'

export default async function docAccessRequestHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
  globalConfig: SanitizedGlobalConfig,
): Promise<Response<CollectionPermission | GlobalPermission> | void> {
  try {
    const accessResults = await docAccess({
      globalConfig,
      req,
    })

    return res.status(httpStatus.OK).json(accessResults)
  } catch (error) {
    return next(error)
  }
}
