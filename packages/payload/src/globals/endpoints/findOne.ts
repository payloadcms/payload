import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestGlobal } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { parseParams } from '../../utilities/parseParams/index.js'
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js'
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js'
import { findOneOperation } from '../operations/findOne.js'

export const findOneHandler: PayloadHandler = async (req) => {
  const globalConfig = getRequestGlobal(req)
  const { data, searchParams } = req
  const { version } = parseParams(req.query)
  const depth = data ? data.depth : searchParams.get('depth')
  const flattenLocales = data
    ? data.flattenLocales
    : searchParams.has('flattenLocales')
      ? searchParams.get('flattenLocales') === 'true'
      : // flattenLocales should be undfined if not provided, so that the default (true) is applied in the operation
        undefined

  const result = await findOneOperation({
    slug: globalConfig.slug,
    data: data
      ? data?.data
      : searchParams.get('data')
        ? JSON.parse(searchParams.get('data') as string)
        : undefined,
    depth: isNumber(depth) ? Number(depth) : undefined,
    flattenLocales,
    globalConfig,
    populate: sanitizePopulateParam(req.query.populate),
    req,
    select: sanitizeSelectParam(req.query.select),
    version: data ? data.version : version,
  })

  return Response.json(result, {
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status: httpStatus.OK,
  })
}
