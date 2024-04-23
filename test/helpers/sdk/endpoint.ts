import type { Endpoint, PayloadHandler } from 'payload/config'

import { addDataAndFileToRequest, addLocalesToRequest } from '@payloadcms/next/utilities'
import httpStatus from 'http-status'

export const handler: PayloadHandler = async (req) => {
  await addDataAndFileToRequest({ request: req })
  addLocalesToRequest({ request: req })

  const { data, payload, user } = req
  const operation = String(data.operation)

  if (typeof payload[operation] === 'function') {
    try {
      const result = await payload[operation]({
        ...(typeof data.args === 'object' ? data.args : {}),
        user,
      })

      return Response.json(result, {
        status: httpStatus.OK,
      })
    } catch (err) {
      payload.logger.error(err)
      return Response.json(err, {
        status: httpStatus.BAD_REQUEST,
      })
    }
  }

  return Response.json(
    {
      message: 'Payload Local API method not found.',
    },
    {
      status: httpStatus.BAD_REQUEST,
    },
  )
}

export const localAPIEndpoint: Endpoint = {
  path: '/local-api',
  method: 'post',
  handler,
}
