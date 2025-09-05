import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestGlobal } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { unpublishOperation } from '../operations/unpublish.js'

export const unpublishHandler: PayloadHandler = async (req) => {
  const globalConfig = getRequestGlobal(req)

  const result = await unpublishOperation({
    globalConfig,
    req,
  })

  return Response.json(
    {
      message: req.t('version:unpublishedSuccessfully'),
      result,
    },
    {
      headers: headersWithCors({
        headers: new Headers(),
        req,
      }),
      status: httpStatus.OK,
    },
  )
}
