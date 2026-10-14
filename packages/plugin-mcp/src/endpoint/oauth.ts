import type { PayloadHandler, PayloadRequest, SanitizedConfig } from 'payload'

import {
  bearerAuthChallengeResponse,
  OAuthError,
  OAuthErrorCode,
} from '@modelcontextprotocol/server'

import { getPluginConfig } from '../utils/getPluginConfig.js'

/**
 * Serves the OAuth protected resource metadata (RFC 9728) at `/api/mcp/oauth-protected-resource`.
 * The OAuth challenge links here, so MCP clients find the authorization server without setup.
 */
export const oauthProtectedResourceEndpoint: PayloadHandler = (req) =>
  getMetadataResponse({ config: req.payload.config, url: req.url! })

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
    getMetadataResponse({ config: await config, url: request.url })

/**
 * Answers an unauthenticated MCP request with a challenge linking to the protected resource
 * metadata, which starts the client's OAuth flow.
 */
export const oauthChallenge = ({ req }: { req: PayloadRequest }): Response =>
  bearerAuthChallengeResponse(
    new OAuthError(OAuthErrorCode.InvalidToken, req.t('error:unauthorized')),
    {
      resourceMetadataUrl: `${getMCPURL({ config: req.payload.config, url: req.url! })}/oauth-protected-resource`,
    },
  )

const getMCPURL = ({ config, url }: { config: SanitizedConfig; url: string }): string =>
  new URL(`${config.routes.api}/mcp`, config.serverURL || url).href

const getMetadataResponse = ({
  config,
  url,
}: {
  config: SanitizedConfig
  url: string
}): Response => {
  const pluginConfig = getPluginConfig({ config })

  if (!pluginConfig.oauth) {
    return new Response(null, { status: 404 })
  }

  return Response.json(
    {
      authorization_servers: pluginConfig.oauth.authorizationServers,
      bearer_methods_supported: ['header'],
      resource: pluginConfig.oauth.resource ?? getMCPURL({ config, url }),
    },
    // Public document, readable by browser-based MCP clients on any origin
    { headers: { 'Access-Control-Allow-Origin': '*' } },
  )
}
