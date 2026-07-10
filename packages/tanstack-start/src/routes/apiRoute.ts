import type { SanitizedConfig } from 'payload'

type ApiRouteHandler = (ctx: { request: Request }) => Promise<Response>

/**
 * Builds the method handlers for the Payload REST/GraphQL catch-all
 * (`/_payload/api/$`). The app supplies `getConfig` (an `@payload-config`
 * import) since the package cannot resolve the consumer's config.
 *
 * Spread the result into a literal `server.handlers` key so TanStack Start's
 * client compiler can statically see — and prune — the server-only route:
 *
 * ```ts
 * export const Route = createFileRoute('/_payload/api/$')({
 *   server: {
 *     handlers: payloadApiHandlers({ getConfig: async () => (await import('@payload-config')).default }),
 *   },
 * })
 * ```
 *
 * The compiler only strips a literal `server:` key from a route-options object
 * expression; wrapping the whole options object in a factory call hides the
 * key, leaking the config graph into the client bundle.
 */
export function payloadApiHandlers({
  getConfig,
}: {
  getConfig: () => Promise<SanitizedConfig>
}): Record<'DELETE' | 'GET' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT', ApiRouteHandler> {
  const handler: ApiRouteHandler = async ({ request }) => {
    const { handleAPIRoute } = await import('../utilities/handleAPIRoute.js')
    return handleAPIRoute({ config: await getConfig(), request })
  }

  return {
    DELETE: handler,
    GET: handler,
    OPTIONS: handler,
    PATCH: handler,
    POST: handler,
    PUT: handler,
  }
}
