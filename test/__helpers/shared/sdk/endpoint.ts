import type { Endpoint, PayloadHandler } from 'payload'

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
        status: 200,
      })
    } catch (err) {
      payload.logger.error(err)
      return Response.json(err, {
        status: 400,
      })
    }
  }

  return Response.json(
    {
      message: 'Payload Local API method not found.',
    },
    {
      status: 400,
    },
  )
}

export const localAPIEndpoint: Endpoint = {
  handler,
  method: 'post',
  path: '/local-api',
}
