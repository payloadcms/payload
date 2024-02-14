import httpStatus from 'http-status'

import { updateOperationGlobal } from 'payload/operations'
import { isNumber } from 'payload/utilities'
import { GlobalRouteHandler } from '../types'

export const update: GlobalRouteHandler = async ({ req, globalConfig }) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')
  const draft = searchParams.get('draft') === 'true'
  const autosave = searchParams.get('autosave') === 'true'

  const result = await updateOperationGlobal({
    autosave,
    data: req.data,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft,
    globalConfig,
    req,
    slug: globalConfig.slug,
  })

  let message = req.t('general:updatedSuccessfully')

  if (draft) message = req.t('version:draftSavedSuccessfully')
  if (autosave) message = req.t('version:autosavedSuccessfully')

  return Response.json(
    {
      message,
      result,
    },
    {
      status: httpStatus.OK,
    },
  )
}
