import httpStatus from 'http-status'
import { restoreVersionOperationGlobal } from 'payload'
import { isNumber } from 'payload/shared'

import type { GlobalRouteHandlerWithID } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'

export const restoreVersion: GlobalRouteHandlerWithID = async ({ id, globalConfig, req }) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const doc = await restoreVersionOperationGlobal({
    id,
    depth: isNumber(depth) ? Number(depth) : undefined,
    globalConfig,
    req,
  })

  return Response.json(
    {
      doc,
      message: req.t('version:restoredSuccessfully'),
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
