import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { restoreVersionOperationGlobal, sanitizePopulateParam } from '../../index.js'
import { getRequestGlobal } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { parseDocumentVersion } from '../../versions/parseDocumentVersion.js'

export const restoreVersionHandler: PayloadHandler = async (req) => {
  const globalConfig = getRequestGlobal(req)
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const doc = await restoreVersionOperationGlobal({
    id: req.routeParams!.id as string,
    depth: isNumber(depth) ? Number(depth) : undefined,
    globalConfig,
    populate: sanitizePopulateParam(req.query.populate),
    req,
    version: parseDocumentVersion({ params: req.query }),
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
