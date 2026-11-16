import { definePlugin } from 'payload'

import type {
  AuthorizedMCP,
  MCPBuiltinOAuthConfig,
  MCPExternalOAuthConfig,
  MCPOAuthConfig,
  MCPOAuthTokens,
  MCPPluginConfig,
  SanitizedMCPPluginConfig,
} from './types.js'

import { mcpEndpoint } from './endpoint/index.js'
import { oauthProtectedResourceEndpoint } from './endpoint/oauth.js'
import { authorizeViewPath, oauthServerEndpoints } from './endpoint/oauthServer.js'
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

export type {
  AuthorizedMCP,
  MCPBuiltinOAuthConfig,
  MCPExternalOAuthConfig,
  MCPOAuthConfig,
  MCPOAuthTokens,
  MCPPluginConfig,
  SanitizedMCPPluginConfig,
}

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
      admin: {
        ...config.admin,
        components: {
          ...config.admin?.components,
          views: {
            ...config.admin?.components?.views,
            // Where users allow MCP clients, for the built-in OAuth server
            mcpAuthorize: {
              Component: '@payloadcms/plugin-mcp/rsc#MCPAuthorizeView',
              exact: true,
              meta: { title: 'Allow an MCP client' },
              path: authorizeViewPath,
            },
          },
        },
      },
      endpoints: [
        ...(config.endpoints ?? []),
        // Payload prefixes /api, so the full path is /api/mcp. getAuthorizedMCP authenticates the
        // request with dev auto-login turned off, so Payload doesn't authenticate it first.
        { disableAuth: true, handler: mcpEndpoint, method: 'post', path: '/mcp' },
        { disableAuth: true, handler: mcpEndpoint, method: 'get', path: '/mcp' },
        {
          disableAuth: true,
          handler: oauthProtectedResourceEndpoint,
          method: 'get',
          path: '/mcp/oauth-protected-resource',
        },
        ...oauthServerEndpoints,
      ],
    }
  },
})
