import { status as httpStatus } from 'http-status'
import * as qs from 'qs-esm'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { type JoinParams, sanitizeJoinParams } from '../../utilities/sanitizeJoinParams.js'
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js'
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js'
import { findByIDOperation } from '../operations/findByID.js'

export const findByIDHandler: PayloadHandler = async (req) => {
  const { searchParams } = req
  const { id, collection } = getRequestCollectionWithID(req)
  const urlSearchParamsParsed: any = qs.parse(searchParams.toString())

  const depth = urlSearchParamsParsed.depth
  const trash = urlSearchParamsParsed.trash === 'true'

  const result = await findByIDOperation({
    id,
    collection,
    data: urlSearchParamsParsed.data,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: searchParams.get('draft') === 'true',
    joins: sanitizeJoinParams(req.query.joins as JoinParams),
    populate: sanitizePopulateParam(req.query.populate),
    req,
    select: sanitizeSelectParam(req.query.select),
    trash,
  })

  return Response.json(result, {
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status: httpStatus.OK,
  })
}
