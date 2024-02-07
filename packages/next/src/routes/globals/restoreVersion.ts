import httpStatus from 'http-status'

import { restoreVersionOperationGlobal } from 'payload/operations'
import { isNumber } from 'payload/utilities'
import { GlobalRouteHandler } from '../types'

export const restoreVersion: GlobalRouteHandler<{ id: string }> = async ({
  req,
  globalConfig,
  id,
}) => {
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
      status: httpStatus.OK,
    },
  )
}
