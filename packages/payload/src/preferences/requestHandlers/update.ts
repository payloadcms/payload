import httpStatus from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import update from '../operations/update.js'

export const updateHandler: PayloadHandler = async (req) => {
  const payloadRequest = req

  const doc = await update({
    key: req.routeParams?.key as string,
    req: payloadRequest,
    user: payloadRequest?.user,
    value: payloadRequest.data.value || payloadRequest.data,
  })

  return Response.json(
    {
      doc,
      message: payloadRequest.t('general:updatedSuccessfully'),
    },
    {
      status: httpStatus.OK,
    },
  )
}
