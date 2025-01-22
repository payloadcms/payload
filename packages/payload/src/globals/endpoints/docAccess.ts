import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestGlobal } from '../../utilities/getRequestEntity.js'
import { docAccessOperation } from '../operations/docAccess.js'

export const docAccessHandler: PayloadHandler = async (req) => {
  const globalConfig = getRequestGlobal(req)
  const result = await docAccessOperation({
    globalConfig,
    req,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
