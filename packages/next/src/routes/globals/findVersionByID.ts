import httpStatus from 'http-status'

import type { PayloadRequest, SanitizedGlobalConfig } from 'payload/types'

import { findVersionByIDGlobal as findVersionByIdOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'

// TODO(JARROD): pattern to catch errors and return correct Response
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

  const result = await findVersionByIdOperation({
    id,
    depth: isNumber(depth) ? Number(depth) : undefined,
    globalConfig,
    req,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
