import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'
import type { Where } from '../../types/index.js'

import { APIError } from '../../errors/APIError.js'
import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { findDistinctOperation } from '../operations/findDistinct.js'

export const findDistinctHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)
  const { depth, field, limit, page, sort, trash, where } = req.query as {
    depth?: string
    field?: string
    limit?: string
    page?: string
    sort?: string
    sortOrder?: string
    trash?: string
    where?: Where
  }

  if (!field) {
    throw new APIError('field must be specified', httpStatus.BAD_REQUEST)
  }

  const result = await findDistinctOperation({
    collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    field,
    limit: isNumber(limit) ? Number(limit) : undefined,
    page: isNumber(page) ? Number(page) : undefined,
    req,
    sort: typeof sort === 'string' ? sort.split(',') : undefined,
    trash: trash === 'true',
    where,
  })

  return Response.json(result, {
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status: httpStatus.OK,
  })
}
