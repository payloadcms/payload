import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestGlobal } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { parseParams } from '../../utilities/parseParams/index.js'
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js'
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js'
import { updateOperation } from '../operations/update.js'

export const updateHandler: PayloadHandler = async (req) => {
  const globalConfig = getRequestGlobal(req)
  const { searchParams } = req
  const { action, autosave } = parseParams(req.query)
  const depth = searchParams.get('depth')
  const publishAllLocales = searchParams.get('publishAllLocales') === 'true'
  const unpublishAllLocales = searchParams.get('unpublishAllLocales') === 'true'

  const result = await updateOperation({
    slug: globalConfig.slug,
    action,
    autosave,
    data: req.data!,
    depth: isNumber(depth) ? Number(depth) : undefined,
    globalConfig,
    populate: sanitizePopulateParam(req.query.populate),
    publishAllLocales,
    req,
    select: sanitizeSelectParam(req.query.select),
    unpublishAllLocales,
  })

  let message = req.t('general:updatedSuccessfully')

  if (action === 'saveDraft') {
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
