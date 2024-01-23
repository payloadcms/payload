import httpStatus from 'http-status'

import type { PayloadRequest, SanitizedGlobalConfig } from 'payload/types'

import { findVersionByIDOperationGlobal } from 'payload/operations'
import { isNumber } from 'payload/utilities'

export const findVersionByID = async ({
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

  const result = await findVersionByIDOperationGlobal({
    id,
    depth: isNumber(depth) ? Number(depth) : undefined,
    globalConfig,
    req,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
