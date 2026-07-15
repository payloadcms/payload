import type { SanitizedConfig } from 'payload'

import { handleEndpoints } from 'payload'

/**
 * Routes a TanStack Start API request (`/api/*`) to Payload's REST/GraphQL
 * endpoint handler. The framework adapter wires this into the `/api/$` route's
 * server handlers, supplying the app's resolved `config`.
 */
export async function handleAPIRoute({
  config,
  request,
}: {
  config: SanitizedConfig
  request: Request
}): Promise<Response> {
  const url = new URL(request.url)
  const slugParts = url.pathname
    .replace(/^\/api\/?/, '')
    .split('/')
    .filter(Boolean)
  const path = slugParts.length ? `/api/${slugParts.join('/')}` : '/api'

  return handleEndpoints({
    config,
    path,
    request,
  })
}
