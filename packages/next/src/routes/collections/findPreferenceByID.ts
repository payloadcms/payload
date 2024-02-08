import httpStatus from 'http-status'

import { findPreferenceByIDOperation } from 'payload/operations'
import { CollectionRouteHandler } from '../types'

export const findPreferenceByID: CollectionRouteHandler<{ id: string }> = async ({ req, id }) => {
  const result = await findPreferenceByIDOperation({
    key: id,
    req,
    user: req.user,
  })

  return Response.json(result, {
    status: httpStatus.OK,
  })
}
