import httpStatus from 'http-status'

import type { PayloadRequest, SanitizedGlobalConfig } from 'payload/types'

import { docAccessGlobal as docAccessOperation } from 'payload/operations'

// TODO(JARROD): pattern to catch errors and return correct Response
export const docAccess = async ({
  req,
  globalConfig,
}: {
  req: PayloadRequest
  globalConfig: SanitizedGlobalConfig
}): Promise<Response> => {
  const result = await docAccessOperation({
    globalConfig,
    req,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
