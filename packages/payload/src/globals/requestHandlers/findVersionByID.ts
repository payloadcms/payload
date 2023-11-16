import type { NextFunction, Response } from 'express'

import type { PayloadRequest } from '../../express/types'
import type { Document } from '../../types'
import type { SanitizedGlobalConfig } from '../config/types'

import { isNumber } from '../../utilities/isNumber'
import findVersionByID from '../operations/findVersionByID'

export default function findVersionByIDHandler(globalConfig: SanitizedGlobalConfig): Document {
  return async function handler(
    req: PayloadRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response<Document> | void> {
    const options = {
      id: req.params.id,
      depth: isNumber(req.query?.depth) ? Number(req.query.depth) : undefined,
      globalConfig,
      req,
    }

    try {
      const doc = await findVersionByID(options)
      return res.json(doc)
    } catch (error) {
      return next(error)
    }
  }
}
