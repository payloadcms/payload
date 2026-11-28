import type { SanitizedConfig } from 'payload'

import { handleEndpoints } from 'payload'
import { formatAdminURL, stripTrailingSlash } from 'payload/shared'

import '../../utilities/devConfigReload.server.js'

const getAPIPath = ({ config, path }: { config: SanitizedConfig; path: string }) =>
  stripTrailingSlash(
    // Config route values are plain strings, but sanitization guarantees the leading slash.
    formatAdminURL({ apiRoute: config.routes.api, path: path as `/${string}`, relative: true }),
  )

/**
 * Routes a TanStack Start API request to Payload's GraphQL handler, the GraphQL Playground, or
 * the REST endpoint handler. The framework adapter wires this into the app's API route and
 * supplies the resolved `config`.
 */
export async function handleAPIRoute({
  config,
  request,
}: {
  config: SanitizedConfig
  request: Request
}): Promise<Response> {
  const pathname = stripTrailingSlash(new URL(request.url).pathname)

  if (
    request.method === 'POST' &&
    pathname === getAPIPath({ config, path: config.routes.graphQL })
  ) {
    const { handleGraphQL } = await import('../graphql/handler.server.js')
    return handleGraphQL({ config, request })
  }

  if (
    request.method === 'GET' &&
    pathname === getAPIPath({ config, path: config.routes.graphQLPlayground })
  ) {
    const { handleGraphQLPlayground } = await import('../graphql/playground.server.js')
    return handleGraphQLPlayground({ config })
  }

  return handleEndpoints({
    config,
    path: new URL(request.url).pathname,
    request,
  })
}
