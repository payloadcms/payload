import httpStatus from 'http-status'

import type { PayloadRequest, SanitizedGlobalConfig } from 'payload/types'

import { docAccessOperationGlobal } from 'payload/operations'

export const docAccess = async ({
  req,
  globalConfig,
}: {
  req: PayloadRequest
  globalConfig: SanitizedGlobalConfig
}): Promise<Response> => {
  const result = await docAccessOperationGlobal({
    globalConfig,
    req,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
