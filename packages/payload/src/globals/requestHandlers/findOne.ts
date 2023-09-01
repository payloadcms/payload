import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'

import type { PayloadRequest } from '../../express/types'
import type { Document } from '../../types'
import type { SanitizedGlobalConfig } from '../config/types'

import { isNumber } from '../../utilities/isNumber'
import findOne from '../operations/findOne'

export type FindOneGlobalResult = Promise<Response<Document> | void>
export type FindOneGlobalResponse = (
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
) => FindOneGlobalResult

export default function findOneHandler(globalConfig: SanitizedGlobalConfig): FindOneGlobalResponse {
  return async function handler(
    req: PayloadRequest,
    res: Response,
    next: NextFunction,
  ): FindOneGlobalResult {
    try {
      const { slug } = globalConfig

      const result = await findOne({
        depth: isNumber(req.query?.depth) ? Number(req.query.depth) : undefined,
        draft: req.query.draft === 'true',
        globalConfig,
        req,
        slug,
      })

      return res.status(httpStatus.OK).json(result)
    } catch (error) {
      return next(error)
    }
  }
}
