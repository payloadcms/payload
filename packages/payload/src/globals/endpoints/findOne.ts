import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestGlobal } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { parseParams } from '../../utilities/parseParams/index.js'
import { findOneOperation } from '../operations/findOne.js'

export const findOneHandler: PayloadHandler = async (req) => {
  const globalConfig = getRequestGlobal(req)
  const { data: dataArg } = req
  const { data, depth, flattenLocales, populate, select, version } = parseParams({
    ...req.query,
    ...dataArg,
  })

  const result = await findOneOperation({
    slug: globalConfig.slug,
    data: dataArg ? (dataArg.data ?? data) : data,
    depth,
    flattenLocales,
    globalConfig,
    populate,
    req,
    select,
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
