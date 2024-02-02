import httpStatus from 'http-status'

import type { PayloadRequest, SanitizedGlobalConfig } from 'payload/types'

import { findOneOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'

export const findOne = async ({
  req,
  globalConfig,
}: {
  req: PayloadRequest
  globalConfig: SanitizedGlobalConfig
}): Promise<Response> => {
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const result = await findOneOperation({
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: searchParams.get('draft') === 'true',
    globalConfig,
    req,
    slug: globalConfig.slug,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
