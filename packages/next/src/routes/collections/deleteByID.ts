import httpStatus from 'http-status'

import type { PayloadRequest } from 'payload/types'
import { isNumber } from 'payload/utilities'
import { deleteByIDOperation } from 'payload/operations'

export const deleteByID = async ({
  req,
  id,
}: {
  req: PayloadRequest
  id: string
}): Promise<Response> => {
  const { searchParams } = new URL(req.url)
  const depth = searchParams.get('depth')
  const doc = await deleteByIDOperation({
    id,
    collection: req.collection,
    depth: isNumber(depth) ? depth : undefined,
    req,
  })

  if (!doc) {
    return Response.json(
      {
        message: req.t('general:notFound'),
      },
      {
        status: httpStatus.NOT_FOUND,
      },
    )
  }

  return Response.json(
    {
      doc,
      message: req.t('general:deletedSuccessfully'),
    },
    {
      status: httpStatus.OK,
    },
  )
}
