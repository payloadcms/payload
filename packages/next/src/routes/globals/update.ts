import httpStatus from 'http-status'

import type { PayloadRequest, SanitizedGlobalConfig } from 'payload/types'

import { updateOperationGlobal } from 'payload/operations'
import { isNumber } from 'payload/utilities'

// TODO(JARROD): pattern to catch errors and return correct Response
export const update = async ({
  req,
  globalConfig,
}: {
  req: PayloadRequest
  globalConfig: SanitizedGlobalConfig
}): Promise<Response> => {
  const { searchParams } = new URL(req.url)
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

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
