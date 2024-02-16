import httpStatus from 'http-status'

import type { PayloadHandler } from '../../exports/config'

import update from '../operations/update'

export const updateHandler: PayloadHandler = async ({ req, routeParams }) => {
  const payloadRequest = req

  const doc = await update({
    key: routeParams?.key,
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
