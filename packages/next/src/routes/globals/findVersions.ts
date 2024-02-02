import httpStatus from 'http-status'

import type { PayloadRequest, SanitizedGlobalConfig, Where } from 'payload/types'

import { findVersionsOperationGlobal } from 'payload/operations'
import { isNumber } from 'payload/utilities'

export const findVersions = async ({
  req,
  globalConfig,
}: {
  req: PayloadRequest
  globalConfig: SanitizedGlobalConfig
}): Promise<Response> => {
  const { searchParams } = req
  const page = searchParams.get('page')
  const limit = searchParams.get('limit')
  const depth = searchParams.get('depth')
  const where = searchParams.get('where')

  const result = await findVersionsOperationGlobal({
    depth: isNumber(depth) ? Number(depth) : undefined,
    globalConfig,
    limit: isNumber(limit) ? Number(limit) : undefined,
    page: isNumber(page) ? Number(page) : undefined,
    req,
    sort: searchParams.get('sort'),
    where: where ? (JSON.parse(where) as Where) : undefined,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
