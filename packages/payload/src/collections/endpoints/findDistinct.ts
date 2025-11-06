import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { APIError } from '../../errors/APIError.js'
import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { parseParams } from '../../utilities/parseParams/index.js'
import { findDistinctOperation } from '../operations/findDistinct.js'

export const findDistinctHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)

  const { depth, field, limit, page, sort, trash, where } = parseParams(req.query)

  if (!field) {
    throw new APIError('field must be specified', httpStatus.BAD_REQUEST)
  }

  const result = await findDistinctOperation({
    collection,
    depth,
    field,
    limit,
    page,
    req,
    sort,
    trash,
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
