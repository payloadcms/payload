// @ts-strict-ignore
import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { restoreVersionOperationGlobal, sanitizePopulateParam } from '../../index.js'
import { getRequestGlobal } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'

export const restoreVersionHandler: PayloadHandler = async (req) => {
  const globalConfig = getRequestGlobal(req)
  const { searchParams } = req
  const depth = searchParams.get('depth')
  const draft = searchParams.get('draft')

  const doc = await restoreVersionOperationGlobal({
    id: req.routeParams.id as string,
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
