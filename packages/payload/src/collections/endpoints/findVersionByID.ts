import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js'
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js'
import { findVersionByIDOperation } from '../operations/findVersionByID.js'

export const findVersionByIDHandler: PayloadHandler = async (req) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const { id, collection } = getRequestCollectionWithID(req)

  const result = await findVersionByIDOperation({
    id,
    collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    populate: sanitizePopulateParam(req.query.populate),
    req,
    select: sanitizeSelectParam(req.query.select),
  })

  return Response.json(result, {
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status: httpStatus.OK,
  })
}
