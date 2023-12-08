import type { NextFunction, Response } from 'express'

import { URL } from 'url'

import type { PayloadRequest } from '../../types'
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
    const { searchParams } = new URL(req.url)
    const depth = searchParams.get('depth')

    const options = {
      id: req.params.id,
      depth: isNumber(depth) ? Number(depth) : undefined,
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
