import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { type JoinParams, sanitizeJoinParams } from '../../utilities/sanitizeJoinParams.js'
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js'
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js'
import { findByIDOperation } from '../operations/findByID.js'

export const findByIDHandler: PayloadHandler = async (req) => {
  const { data, searchParams } = req
  const { id, collection } = getRequestCollectionWithID(req)
  const depth = data ? data.depth : searchParams.get('depth')
  const trash = data ? data.trash : searchParams.get('trash') === 'true'
  const flattenLocales = data ? data.flattenLocales : searchParams.get('flattenLocales') === 'true'

  const result = await findByIDOperation({
    id,
    collection,
    data: data
      ? data?.data
      : searchParams.get('data')
        ? JSON.parse(searchParams.get('data') as string)
        : undefined,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: data ? data.draft : searchParams.get('draft') === 'true',
    flattenLocales,
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
