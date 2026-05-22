import { renderGraphiQL } from '@graphql-yoga/render-graphiql'
import { createPayloadRequest, type SanitizedConfig } from 'payload'
import { formatAdminURL } from 'payload/shared'

export const GET = (config: Promise<SanitizedConfig>) => async (request: Request) => {
  const req = await createPayloadRequest({
    config,
    request,
  })

  const isGraphQLDisabled = req.payload.config.graphQL.disable
  const isGraphiQLDisabled =
    process.env.NODE_ENV === 'production' &&
    req.payload.config.graphQL.disablePlaygroundInProduction

  if (isGraphQLDisabled || isGraphiQLDisabled) {
    return new Response('Route Not Found', { status: 404 })
  }

  const endpoint = formatAdminURL({
    apiRoute: req.payload.config.routes.api,
    path: req.payload.config.routes.graphQL as `/${string}`,
  })

  return new Response(
    renderGraphiQL({
      credentials: 'include',
      endpoint,
      title: 'Payload GraphiQL',
    }),
    {
      headers: {
        'Content-Type': 'text/html',
      },
      status: 200,
    },
  )
}
