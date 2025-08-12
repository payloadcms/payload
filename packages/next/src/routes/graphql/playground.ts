import { renderPlaygroundPage } from 'graphql-playground-html'
import { createPayloadRequest, type SanitizedConfig } from 'payload'

export const GET = (config: Promise<SanitizedConfig>) => async (request: Request) => {
  const req = await createPayloadRequest({
    config,
    request,
  })

  if (
    (!req.payload.config.graphQL.disable &&
      !req.payload.config.graphQL.disablePlaygroundInProduction &&
      process.env.NODE_ENV === 'production') ||
    process.env.NODE_ENV !== 'production'
  ) {
    return new Response(
      renderPlaygroundPage({
        endpoint: `${req.payload.config.routes.api}${req.payload.config.routes.graphQL}`,
        settings: {
          'request.credentials': 'include',
        },
      }),
      {
        headers: {
          'Content-Type': 'text/html',
        },
        status: 200,
      },
    )
  } else {
    return new Response('Route Not Found', { status: 404 })
  }
}
