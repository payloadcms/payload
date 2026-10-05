import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestGlobal } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js'
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js'
import { parseDocumentVersion } from '../../versions/parseDocumentVersion.js'
import { updateOperation } from '../operations/update.js'

export const updateHandler: PayloadHandler = async (req) => {
  const globalConfig = getRequestGlobal(req)
  const { searchParams } = req
  const depth = searchParams.get('depth')
  const version = parseDocumentVersion({ params: req.query })
  const autosave = searchParams.get('autosave') === 'true'

  const result = await updateOperation({
    slug: globalConfig.slug,
    autosave,
    data: req.data!,
    depth: isNumber(depth) ? Number(depth) : undefined,
    globalConfig,
    populate: sanitizePopulateParam(req.query.populate),
    req,
    select: sanitizeSelectParam(req.query.select),
    version,
  })

  let message = req.t('general:updatedSuccessfully')

  if (version === 'draft') {
    message = req.t('version:draftSavedSuccessfully')
  }
  if (autosave) {
    message = req.t('version:autosavedSuccessfully')
  }

  return Response.json(
    {
      message,
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
