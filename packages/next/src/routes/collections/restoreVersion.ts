import httpStatus from 'http-status'

import { restoreVersionOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'
import { CollectionRouteHandlerWithID } from '../types'

export const restoreVersion: CollectionRouteHandlerWithID = async ({ req, collection, id }) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const result = await restoreVersionOperation({
    id,
    collection,
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
