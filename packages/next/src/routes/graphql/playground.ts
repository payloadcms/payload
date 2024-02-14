import { renderPlaygroundPage } from 'graphql-playground-html'
import { createPayloadRequest } from '../../utilities/createPayloadRequest'
import type { SanitizedConfig } from 'payload/types'

export const GET = (config: Promise<SanitizedConfig>) => async (request: Request) => {
  const req = await createPayloadRequest({
    request,
    config,
  })

  if (
    (!req.payload.config.graphQL.disable &&
      !req.payload.config.graphQL.disablePlaygroundInProduction &&
      process.env.NODE_ENV === 'production') ||
    process.env.NODE_ENV !== 'production'
  ) {
    return new Response(
      renderPlaygroundPage({
        settings: {
          'request.credentials': 'include',
        },
        endpoint: `${req.payload.config.routes.api}${req.payload.config.routes.graphQL}`,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      },
    )
  } else {
    return new Response('Route Not Found', { status: 404 })
  }
}
