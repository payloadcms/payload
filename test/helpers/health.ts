import type { Endpoint, PayloadHandler } from 'payload'

import httpStatus from 'http-status'

const handler: PayloadHandler = () => {
  return Response.json(
    {
      message: 'Payload is running!',
    },
    {
      status: httpStatus.OK,
    },
  )
}

export const healthEndpoint: Endpoint = {
  path: '/health',
  method: 'get',
  handler,
}
