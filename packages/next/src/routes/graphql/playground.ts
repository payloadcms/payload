import { renderPlaygroundPage } from 'graphql-playground-html'
import { createPayloadRequest, type SanitizedConfig } from 'payload'
import { formatAdminURL } from 'payload/shared'

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
    const endpoint = formatAdminURL({
      apiRoute: req.payload.config.routes.api,
      path: req.payload.config.routes.graphQL as `/${string}`,
    })
    return new Response(
      renderPlaygroundPage({
        endpoint,
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
