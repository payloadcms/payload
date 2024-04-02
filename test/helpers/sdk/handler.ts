import type { PayloadRequest } from 'payload/types'

import httpStatus from 'http-status'

export const localAPIHandler = async ({ payload, data, user, body }: PayloadRequest) => {
  const method = String(data.method)

  if (typeof payload[method] === 'function') {
    try {
      const result = await payload[method]({
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
