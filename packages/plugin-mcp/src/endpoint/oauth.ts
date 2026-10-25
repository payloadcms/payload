import type { OAuthProtectedResourceMetadata } from '@modelcontextprotocol/server'
import type { PayloadHandler, PayloadRequest, SanitizedConfig } from 'payload'

import {
  bearerAuthChallengeResponse,
  OAuthError,
  OAuthErrorCode,
} from '@modelcontextprotocol/server'
import { createPayloadRequest, getPayload } from 'payload'

import { getPluginConfig } from '../utils/getPluginConfig.js'

/**
 * Serves the OAuth protected resource metadata (RFC 9728) at `/api/mcp/oauth-protected-resource`.
 * The OAuth challenge links here, so MCP clients find the authorization server without setup.
 */
export const oauthProtectedResourceEndpoint: PayloadHandler = (req) => getMetadataResponse({ req })

/**
 * Serves the same metadata for clients that ignore the challenge's link and only look at
 * `/.well-known/oauth-protected-resource`. Mount it at the site root, e.g. in Next.js at
 * `app/.well-known/oauth-protected-resource/[[...path]]/route.ts`:
 *
 * ```ts
 * import config from '@payload-config'
 * import { oauthProtectedResourceHandler } from '@payloadcms/plugin-mcp'
 *
 * export const GET = oauthProtectedResourceHandler(config)
 * ```
 */
export const oauthProtectedResourceHandler =
  (config: Promise<SanitizedConfig> | SanitizedConfig) =>
  async (request: Request): Promise<Response> =>
    getMetadataResponse({
      req: await createPayloadRequest({ payload: await getPayload({ config }), req: request }),
    })

/**
 * Answers an unauthenticated MCP request with a challenge linking to the protected resource
 * metadata, which starts the client's OAuth flow.
 */
export const oauthChallenge = ({ req }: { req: PayloadRequest }): Response => {
  const { oauth } = getPluginConfig({ config: req.payload.config })
  const response = bearerAuthChallengeResponse(
    new OAuthError(OAuthErrorCode.InvalidToken, req.t('error:unauthorized')),
    {
      requiredScopes: oauth?.type === 'external' ? oauth.scopes : undefined,
      resourceMetadataUrl: `${getMCPResource({ req })}/oauth-protected-resource`,
    },
  )

  // Lets browser-based MCP clients read the challenge, when Payload's `cors` setting allows them
  response.headers.set('Access-Control-Expose-Headers', 'WWW-Authenticate')

  return response
}

/**
 * The MCP endpoint's address, as advertised in the metadata's `resource`. The metadata link and
 * the built-in authorization server's issuer are based on it. Clients send it when they sign in,
 * and authorization servers that support it put it in the access token's audience.
 */
export const getMCPResource = ({ req }: { req: PayloadRequest }): string => {
  const { config } = req.payload
  const resource = getPluginConfig({ config }).oauth?.resource

  if (typeof resource === 'function') {
    return resource({ req })
  }

  return resource ?? new URL(`${config.routes.api}/mcp`, config.serverURL || req.url).href
}

const getMetadataResponse = async ({ req }: { req: PayloadRequest }): Promise<Response> => {
  const { config } = req.payload
  const { oauth } = getPluginConfig({ config })

  if (!oauth) {
    return new Response(null, { status: 404 })
  }

  const resource = getMCPResource({ req })

  return Response.json(
    {
      authorization_servers:
        oauth.type === 'builtin'
          ? [`${resource}/oauth`]
          : typeof oauth.authorizationServers === 'function'
            ? await oauth.authorizationServers({ req })
            : oauth.authorizationServers,
      bearer_methods_supported: ['header'],
      resource,
      scopes_supported: oauth.type === 'external' ? oauth.scopes : undefined,
    } satisfies OAuthProtectedResourceMetadata,
    // Public document, readable by browser-based MCP clients on any origin. Not cached, since its
    // URLs can depend on the request.
    { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' } },
  )
}
