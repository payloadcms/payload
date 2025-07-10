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
  const { field, limit, page, sortOrder, where } = req.query as {
    field?: string
    limit?: string
    page?: string
    sortOrder?: string
    where?: Where
  }

  if (!field) {
    throw new APIError('field must be specified', httpStatus.BAD_REQUEST)
  }

  const result = await findDistinctOperation({
    collection,
    field,
    limit: isNumber(limit) ? Number(limit) : undefined,
    page: isNumber(page) ? Number(page) : undefined,
    req,
    sortOrder: sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : undefined,
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
