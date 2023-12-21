import httpStatus from 'http-status'

import { PayloadRequest } from 'payload/types'
import { restoreVersion as restoreVersionOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'

// TODO(JARROD): pattern to catch errors and return correct Response
export const restoreVersion = async ({
  req,
  id,
}: {
  req: PayloadRequest
  id: string
}): Promise<Response> => {
  const { searchParams } = new URL(req.url)
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
      // ...formatSuccessResponse(req.t('version:restoredSuccessfully'), 'message'),
    },
    {
      status: httpStatus.OK,
    },
  )
}
