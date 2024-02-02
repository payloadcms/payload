import httpStatus from 'http-status'

import { PayloadRequest } from 'payload/types'
import { restoreVersionOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'

export const restoreVersion = async ({
  req,
  id,
}: {
  req: PayloadRequest
  id: string
}): Promise<Response> => {
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const result = await restoreVersionOperation({
    id,
    collection: req.collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    req,
  })

  return Response.json(
    {
      ...result,
      message: req.t('version:restoredSuccessfully'),
    },
    {
      status: httpStatus.OK,
    },
  )
}
