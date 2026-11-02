import type { PayloadHandler } from '../../config/types.js'

import { getRequestGlobal } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { httpStatus } from '../../utilities/httpStatus.js'
import { docAccessOperation } from '../operations/docAccess.js'

export const docAccessHandler: PayloadHandler = async (req) => {
  const globalConfig = getRequestGlobal(req)
  const result = await docAccessOperation({
    data: req.data,
    globalConfig,
    req,
  })

  return Response.json(result, {
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status: httpStatus.OK,
  })
}
