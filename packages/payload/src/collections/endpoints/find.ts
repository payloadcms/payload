import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { parseParams } from '../../utilities/parseParams/index.js'
import { findOperation } from '../operations/find.js'

export const findHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)

  const { depth, draft, joins, limit, page, pagination, populate, select, sort, trash, where } =
    parseParams(req.query)

  const result = await findOperation({
    collection,
    depth,
    draft,
    joins,
    limit,
    page,
    pagination,
    populate,
    req,
    select,
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
