import httpStatus from 'http-status'

import type { PayloadRequest, SanitizedGlobalConfig } from 'payload/types'

import { restoreVersionGlobal as restoreVersionOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'

// TODO(JARROD): pattern to catch errors and return correct Response
export const restoreVersion = async ({
  req,
  globalConfig,
  id,
}: {
  req: PayloadRequest
  globalConfig: SanitizedGlobalConfig
  id: string
}): Promise<Response> => {
  const { searchParams } = new URL(req.url)
  const depth = searchParams.get('depth')

  const doc = await restoreVersionOperation({
    id,
    depth: isNumber(depth) ? Number(depth) : undefined,
    globalConfig,
    req,
  })

  // ...formatSuccessResponse(req.t('version:restoredSuccessfully'), 'message'),
  return Response.json(doc, {
    status: httpStatus.OK,
  })
}
