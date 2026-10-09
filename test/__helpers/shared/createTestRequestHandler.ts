import type { SanitizedConfig } from 'payload'

import {
  GRAPHQL_POST,
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'

type TestRequestHandler = (args: {
  isGraphQL?: boolean
  request: Request
  slug?: string[]
}) => Promise<Response>

export function createTestRequestHandler({
  config,
}: {
  config: SanitizedConfig
}): TestRequestHandler {
  if (process.env.PAYLOAD_FRAMEWORK === 'tanstack-start') {
    return async ({ isGraphQL, request }) => {
      if (isGraphQL) {
        const { handleGraphQL } = await import(
          '../../../packages/tanstack-start/src/routes/graphql/handler.server.js'
        )

        return handleGraphQL({ config, request })
      }

      const { handleAPIRoute } = await import(
        '../../../packages/tanstack-start/src/routes/rest/handler.server.js'
      )

      return handleAPIRoute({ config, request })
    }
  }

  const graphql = GRAPHQL_POST(config)
  const rest = {
    DELETE: REST_DELETE(config),
    GET: REST_GET(config),
    OPTIONS: REST_OPTIONS(config),
    PATCH: REST_PATCH(config),
    POST: REST_POST(config),
    PUT: REST_PUT(config),
  }

  return ({ isGraphQL, request, slug }) => {
    if (isGraphQL) {
      return graphql(request)
    }

    return rest[request.method as keyof typeof rest](request, {
      params: Promise.resolve({ slug }),
    })
  }
}
