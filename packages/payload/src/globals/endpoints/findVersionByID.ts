// @ts-strict-ignore
import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestGlobal } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js'
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js'
import { findVersionByIDOperation } from '../operations/findVersionByID.js'

export const findVersionByIDHandler: PayloadHandler = async (req) => {
  const globalConfig = getRequestGlobal(req)
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const result = await findVersionByIDOperation({
    id: req.routeParams.id as string,
    depth: isNumber(depth) ? Number(depth) : undefined,
    globalConfig,
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
