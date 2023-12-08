import type { NextFunction, Response } from 'express'

import httpStatus from 'http-status'
import { URL } from 'url'

import type { PaginatedDocs } from '../../database/types'
import type { PayloadRequest } from '../../types'
import type { TypeWithID } from '../config/types'

import { isNumber } from '../../utilities/isNumber'
import find from '../operations/find'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function findHandler<T extends TypeWithID = any>(
  req: PayloadRequest,
  res: Response,
  next: NextFunction,
): Promise<Response<PaginatedDocs<T>> | void> {
  try {
    const { searchParams } = new URL(req.url)
    const depth = searchParams.get('depth')
    const limit = searchParams.get('limit')
    const page = searchParams.get('page')
    const where = searchParams.get('where')

    const result = await find({
      collection: req.collection,
      depth: isNumber(depth) ? Number(depth) : undefined,
      draft: searchParams.get('draft') === 'true',
      limit: isNumber(limit) ? Number(limit) : undefined,
      page: isNumber(page) ? Number(page) : undefined,
      req,
      sort: searchParams.get('sort'),
      where: where ? JSON.parse(where) : undefined,
    })

    return res.status(httpStatus.OK).json(result)
  } catch (error) {
    return next(error)
  }
}
