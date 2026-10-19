import type { SanitizedConfig } from 'payload'

import { handleEndpoints } from 'payload'

/**
 * Routes a TanStack Start API request to Payload's endpoint handler. The framework adapter
 * wires this into the app's API route and supplies the resolved `config`.
 */
export async function handleAPIRoute({
  config,
  request,
}: {
  config: SanitizedConfig
  request: Request
}): Promise<Response> {
  return handleEndpoints({
    config,
    path: new URL(request.url).pathname,
    request,
  })
}
