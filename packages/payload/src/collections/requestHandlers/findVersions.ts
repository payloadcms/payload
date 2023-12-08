import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'
import { URL } from 'url'

import type { PaginatedDocs } from '../../database/types'
import type { PayloadRequest } from '../../types'
import type { Where } from '../../types'
import type { TypeWithID } from '../config/types'

import { isNumber } from '../../utilities/isNumber'
import findVersions from '../operations/findVersions'

export default async function findVersionsHandler<T extends TypeWithID = any>(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<Response<PaginatedDocs<T>> | void> {
  try {
    const { searchParams } = new URL(req.url)
    const page = searchParams.get('page')
    const depth = searchParams.get('depth')
    const limit = searchParams.get('limit')
    const where = searchParams.get('where')
    const sort = searchParams.get('sort')

    const options = {
      collection: req.collection,
      depth: isNumber(depth) ? Number(depth) : undefined,
      limit: isNumber(limit) ? Number(limit) : undefined,
      page: isNumber(page) ? Number(page) : undefined,
      payload: req.payload,
      req,
      sort: sort,
      where: where ? (JSON.parse(where) as Where) : undefined,
    }

    const result = await findVersions(options)

    return res.status(httpStatus.OK).json(result)
  } catch (error) {
    return next(error)
  }
}
