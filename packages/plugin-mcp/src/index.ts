import { definePlugin } from 'payload'

import type { AuthorizedMCP, MCPPluginConfig, SanitizedMCPPluginConfig } from './types.js'

import { mcpEndpoint } from './endpoint/index.js'
import { sanitizeMCPConfig } from './mcp/sanitizeMCPConfig.js'

declare module 'payload' {
  export interface PayloadRequestAPI {
    MCP: true
  }
  interface RegisteredPlugins {
    /** After the plugin's `plugin` callback runs, `options` holds the sanitized config. */
    '@payloadcms/plugin-mcp': MCPPluginConfig
  }
}

export type { AuthorizedMCP, MCPPluginConfig, SanitizedMCPPluginConfig }

export { defineCollectionTool, defineGlobalTool, definePrompt, defineTool } from './defineTool.js'

export const mcpPlugin = definePlugin<MCPPluginConfig>({
  slug: '@payloadcms/plugin-mcp',
  order: 10,
  plugin: ({ config, plugins, ...rawConfig }) => {
    const pluginConfig = sanitizeMCPConfig({ config, pluginConfig: rawConfig })

    // Stash the sanitized config on plugin options so `getPluginConfig()` reads it.
    const registered = plugins['@payloadcms/plugin-mcp']
    if (registered) {
      // @ts-expect-error
      registered.sanitizedOptions = pluginConfig as unknown as typeof registered.options
    }

    if (pluginConfig.disabled) {
      return config
    }

    return {
      ...config,
      endpoints: [
        ...(config.endpoints ?? []),
        // Payload prefixes /api, so the full path is /api/mcp.
        { handler: mcpEndpoint, method: 'post', path: '/mcp' },
        // Streamable HTTP's optional server=>client GET stream. We don't offer
        // one, so answer 405 per spec-— clients then skip it cleanly
        {
          handler: () => new Response(null, { headers: { Allow: 'POST' }, status: 405 }),
          method: 'get',
          path: '/mcp',
        },
      ],
    }
  },
})
