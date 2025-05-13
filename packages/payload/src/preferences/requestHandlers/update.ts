// @ts-strict-ignore
import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { update } from '../operations/update.js'

export const updateHandler: PayloadHandler = async (incomingReq) => {
  // We cannot import the addDataAndFileToRequest utility here from the 'next' package because of dependency issues
  // However that utility should be used where possible instead of manually appending the data
  let data

  try {
    data = await incomingReq.json()
  } catch (_err) {
    data = {}
  }

  const reqWithData: PayloadRequest = incomingReq

  if (data) {
    reqWithData.data = data
    reqWithData.json = () => Promise.resolve(data)
  }

  const doc = await update({
    key: reqWithData.routeParams?.key as string,
    req: reqWithData,
    user: reqWithData?.user,
    value: reqWithData.data.value || reqWithData.data,
  })

  return Response.json(
    {
      doc,
      message: reqWithData.t('general:updatedSuccessfully'),
    },
    {
      status: httpStatus.OK,
    },
  )
}
