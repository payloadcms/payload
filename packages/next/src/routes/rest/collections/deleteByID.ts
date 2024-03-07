import httpStatus from 'http-status'
import { deleteByIDOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'

import type { CollectionRouteHandlerWithID } from '../types.js'

export const deleteByID: CollectionRouteHandlerWithID = async ({ id, collection, req }) => {
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
