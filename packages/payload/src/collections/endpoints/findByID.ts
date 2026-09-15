import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { parseParams } from '../../utilities/parseParams/index.js'
import { findByIDOperation } from '../operations/findByID.js'

export const findByIDHandler: PayloadHandler = async (req) => {
  const { data: dataArg } = req
  const { id, collection } = getRequestCollectionWithID(req)

  const { data, depth, flattenLocales, joins, populate, select, trash, version } = parseParams({
    ...req.query,
    ...dataArg,
  })

  const result = await findByIDOperation({
    id,
    collection,
    data,
    depth,
    flattenLocales,
    joins,
    populate,
    req,
    select,
    trash,
    version,
  })

  return Response.json(result, {
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status: httpStatus.OK,
  })
}
