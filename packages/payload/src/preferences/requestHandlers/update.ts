import httpStatus from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import update from '../operations/update.js'

export const updateHandler: PayloadHandler = async (req) => {
  // We cannot import the addDataAndFileToRequest utility here from the 'next' package because of dependency issues
  // However that utility should be used where possible instead of manually appending the data
  let data

  try {
    data = await req.json()
  } catch (error) {
    data = {}
  }

  if (data) {
    req.data = data
    req.json = () => Promise.resolve(data)
  }

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
