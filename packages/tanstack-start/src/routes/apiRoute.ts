import type { SanitizedConfig } from 'payload'

/**
 * Route options for the Payload REST/GraphQL catch-all (`/_payload/api/$`). The
 * app supplies `getConfig` (an `@payload-config` import) since the package cannot
 * resolve the consumer's config.
 */
export function payloadApiRoute({ getConfig }: { getConfig: () => Promise<SanitizedConfig> }) {
  const handler = async ({ request }: { request: Request }) => {
    const { handleAPIRoute } = await import('../utilities/handleAPIRoute.js')
    return handleAPIRoute({ config: await getConfig(), request })
  }

  return {
    server: {
      handlers: {
        DELETE: handler,
        GET: handler,
        OPTIONS: handler,
        PATCH: handler,
        POST: handler,
        PUT: handler,
      },
    },
  }
}
