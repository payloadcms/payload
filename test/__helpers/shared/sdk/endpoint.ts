import type { Endpoint, PayloadHandler } from 'payload'

import { status as httpStatus } from 'http-status'
import { addDataAndFileToRequest } from 'payload'

export const handler: PayloadHandler = async (req) => {
  await addDataAndFileToRequest(req)

  const { data, payload, user } = req

  const operation = data?.operation ? String(data.operation) : undefined

  if (data?.operation && typeof payload[operation] === 'function') {
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
