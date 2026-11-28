import type { SanitizedConfig } from 'payload'

import { renderPlaygroundPage } from 'graphql-playground-html'
import { formatAdminURL } from 'payload/shared'

/**
 * Serves the GraphQL Playground for TanStack Start apps.
 * Mirrors `@payloadcms/next`'s `GRAPHQL_PLAYGROUND_GET` route handler.
 */
export const handleGraphQLPlayground = ({ config }: { config: SanitizedConfig }): Response => {
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction && (config.graphQL.disable || config.graphQL.disablePlaygroundInProduction)) {
    return new Response('Route Not Found', { status: 404 })
  }

  const endpoint = formatAdminURL({
    apiRoute: config.routes.api,
    // Config route values are plain strings, but sanitization guarantees the leading slash.
    path: config.routes.graphQL as `/${string}`,
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
}
