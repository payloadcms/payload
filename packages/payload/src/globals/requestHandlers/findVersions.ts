import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'
import { URL } from 'url'

import type { TypeWithID } from '../../collections/config/types'
import type { PaginatedDocs } from '../../database/types'
import type { PayloadRequest } from '../../types'
import type { Where } from '../../types'
import type { SanitizedGlobalConfig } from '../config/types'

import { isNumber } from '../../utilities/isNumber'
import findVersions from '../operations/findVersions'

export default function findVersionsHandler(global: SanitizedGlobalConfig) {
  return async function handler<T extends TypeWithID = any>(
    req: PayloadRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response<PaginatedDocs<T>> | void> {
    try {
      const { searchParams } = new URL(req.url)
      const page = searchParams.get('page')
      const limit = searchParams.get('limit')
      const depth = searchParams.get('depth')
      const where = searchParams.get('where')

      const options = {
        depth: isNumber(depth) ? Number(depth) : undefined,
        globalConfig: global,
        limit: isNumber(limit) ? Number(limit) : undefined,
        page: isNumber(page) ? Number(page) : undefined,
        req,
        sort: searchParams.get('sort'),
        where: where ? (JSON.parse(where) as Where) : undefined,
      }

      const result = await findVersions(options)

      return res.status(httpStatus.OK).json(result)
    } catch (error) {
      return next(error)
    }
  }
}
