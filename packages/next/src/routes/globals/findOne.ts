import httpStatus from 'http-status'

import type { PayloadRequest, SanitizedGlobalConfig } from 'payload/types'

import { findOneOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'

// TODO(JARROD): pattern to catch errors and return correct Response
export const findOne = async ({
  req,
  globalConfig,
}: {
  req: PayloadRequest
  globalConfig: SanitizedGlobalConfig
}): Promise<Response> => {
  const { searchParams } = new URL(req.url)
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
