import httpStatus from 'http-status'
import { restoreVersionOperationGlobal, sanitizePopulateParam } from 'payload'
import { isNumber } from 'payload/shared'

import type { GlobalRouteHandlerWithID } from '../types.js'

import { headersWithCors } from '../../../utilities/headersWithCors.js'

export const restoreVersion: GlobalRouteHandlerWithID = async ({ id, globalConfig, req }) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')
  const draft = searchParams.get('draft')

  const doc = await restoreVersionOperationGlobal({
    id,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: draft === 'true' ? true : undefined,
    globalConfig,
    populate: sanitizePopulateParam(req.query.populate),
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
