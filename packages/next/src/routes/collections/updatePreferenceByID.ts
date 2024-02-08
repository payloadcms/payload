import httpStatus from 'http-status'

import { updatePreferenceByIDOperation } from 'payload/operations'
import { CollectionRouteHandler } from '../types'

export const updatePreferenceByID: CollectionRouteHandler<{ id: string }> = async ({ req, id }) => {
  try {
    const doc = await updatePreferenceByIDOperation({
      key: id,
      req,
      user: req.user,
      value: req.data,
    })

    let message = req.t('general:updatedSuccessfully')

    return Response.json(
      {
        message,
        doc,
      },
      {
        status: httpStatus.OK,
      },
    )
  } catch (error) {
    return Response.json(
      {
        message: error.message,
      },
      {
        status: error.status || httpStatus.INTERNAL_SERVER_ERROR,
      },
    )
  }
}
