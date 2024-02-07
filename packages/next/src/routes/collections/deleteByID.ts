import httpStatus from 'http-status'

import { isNumber } from 'payload/utilities'
import { deleteByIDOperation } from 'payload/operations'
import { CollectionRouteHandler } from '../types'

export const deleteByID: CollectionRouteHandler<{ id: string }> = async ({
  req,
  collection,
  id,
}) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')
  const doc = await deleteByIDOperation({
    id,
    collection,
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
