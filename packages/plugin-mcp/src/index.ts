import { definePlugin } from 'payload'

import type { AuthorizedMCP, MCPPluginConfig, SanitizedMCPPluginConfig } from './types.js'

import { mcpEndpoint } from './endpoint/index.js'
import { oauthProtectedResourceEndpoint } from './endpoint/oauth.js'
import { sanitizeMCPConfig } from './mcp/sanitizeMCPConfig.js'

declare module 'payload' {
  export interface PayloadRequestAPI {
    MCP: true
  }
  interface RegisteredPlugins {
    /** After the plugin's `plugin` callback runs, `options` holds the sanitized config. */
    '@payloadcms/plugin-mcp': MCPPluginConfig
  }
  export interface RequestContext {
    /** Set on MCP requests before they're authenticated. */
    mcp?: {
      /** The MCP endpoint's address, which OAuth access tokens for MCP are issued for. */
      resource: string
    }
  }
}

export type { AuthorizedMCP, MCPPluginConfig, SanitizedMCPPluginConfig }

export { defineCollectionTool, defineGlobalTool, definePrompt, defineTool } from './defineTool.js'
export { oauthProtectedResourceHandler } from './endpoint/oauth.js'

export const mcpPlugin = definePlugin<MCPPluginConfig>({
  slug: '@payloadcms/plugin-mcp',
  order: 10,
  plugin: ({ config, options, plugins }) => {
    const pluginConfig = sanitizeMCPConfig({ config, pluginConfig: options })

    // Stash the sanitized config on plugin options so `getPluginConfig()` reads it.
    const registered = plugins['@payloadcms/plugin-mcp']
    if (registered) {
      // @ts-expect-error
      registered.sanitizedOptions = pluginConfig
    }

    if (pluginConfig.disabled) {
      return config
    }

    return {
      ...config,
      endpoints: [
        ...(config.endpoints ?? []),
        // Payload prefixes /api, so the full path is /api/mcp. getAuthorizedMCP authenticates the
        // request with dev auto-login turned off, so Payload doesn't authenticate it first.
        { disableAuth: true, handler: mcpEndpoint, method: 'post', path: '/mcp' },
        // Streamable HTTP's optional server=>client GET stream. We don't offer
        // one, so answer 405 per spec-— clients then skip it cleanly
        {
          disableAuth: true,
          handler: () => new Response(null, { headers: { Allow: 'POST' }, status: 405 }),
          method: 'get',
          path: '/mcp',
        },
        {
          disableAuth: true,
          handler: oauthProtectedResourceEndpoint,
          method: 'get',
          path: '/mcp/oauth-protected-resource',
        },
      ],
    }
  },
})
