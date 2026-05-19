import { definePlugin } from 'payload'

import type { AuthorizedMCP, MCPPluginConfig, SanitizedMCPPluginConfig } from './types.js'

import { getAPIKeysCollection } from './collection/index.js'
import { mcpEndpoint } from './endpoint/index.js'
import { sanitizeMCPConfig } from './mcp/sanitizeMCPConfig.js'

declare module 'payload' {
  export interface PayloadRequest {
    payloadAPI: 'GraphQL' | 'local' | 'MCP' | 'REST'
  }
  interface RegisteredPlugins {
    /** After the plugin's `plugin` callback runs, `options` holds the sanitized config. */
    '@payloadcms/plugin-mcp': MCPPluginConfig
  }
}

export type { AuthorizedMCP, MCPPluginConfig, SanitizedMCPPluginConfig }

/**
 * The MCP Plugin for Payload.
 */
export const mcpPlugin = definePlugin<MCPPluginConfig>({
  slug: '@payloadcms/plugin-mcp',
  order: 10,
  plugin: ({ config, plugins, ...rawConfig }) => {
    const pluginConfig = sanitizeMCPConfig({ config, pluginConfig: rawConfig })

    // Replace the registered options so that the sanitized config is
    // read via `getPluginConfig()` (matches our type augmentation above).
    const registered = plugins['@payloadcms/plugin-mcp']
    if (registered) {
      // @ts-expect-error
      registered.sanitizedOptions = pluginConfig as unknown as typeof registered.options
    }

    /**
     * API Keys
     * --------
     * Every collection / global in the Payload config is exposed via MCP by default.
     * The API key collection generates a checkbox group for each one so admins can
     * uncheck individual operations to restrict a specific key. The plugin's own
     * `payload-mcp-api-keys` collection is hard-excluded
     */
    ;(config.collections ??= []).push(
      getAPIKeysCollection({
        pluginConfig,
      }),
    )

    /**
     * If the plugin is disabled, we still want to keep added collections,
     * to ensure that generated types and the database schema do not drift
     * between environments where the plugin is enabled and disabled.
     */
    if (pluginConfig.disabled) {
      return config
    }

    return {
      ...config,
      endpoints: [
        ...(config.endpoints ?? []),
        /**
         * This is the primary MCP Server Endpoint.
         * Payload will automatically add the /api prefix,
         * so the full path is `/api/mcp`
         */
        {
          handler: mcpEndpoint,
          method: 'post',
          path: '/mcp',
        },
      ],
    }
  },
})
