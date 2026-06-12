import { defaultUserCollection, definePlugin } from 'payload'

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

export { defineCollectionTool, defineGlobalTool, definePrompt, defineTool } from './defineTool.js'

export const mcpPlugin = definePlugin<MCPPluginConfig>({
  slug: '@payloadcms/plugin-mcp',
  order: 10,
  plugin: ({ config, plugins, ...rawConfig }) => {
    // Our `payload-mcp-api-keys` is auth-enabled; if it'd be the only auth
    // collection, Payload's later sanitize would pick it as `admin.user`.
    // Pre-seed the default user collection to prevent that.
    if (!config.admin?.user) {
      const firstCollectionWithAuth = (config.collections ?? []).find(({ auth }) => Boolean(auth))
      if (!firstCollectionWithAuth) {
        ;(config.collections ??= []).push(defaultUserCollection)
      }
    }

    const pluginConfig = sanitizeMCPConfig({ config, pluginConfig: rawConfig })

    // Stash the sanitized config on plugin options so `getPluginConfig()` reads it.
    const registered = plugins['@payloadcms/plugin-mcp']
    if (registered) {
      // @ts-expect-error
      registered.sanitizedOptions = pluginConfig as unknown as typeof registered.options
    }

    ;(config.collections ??= []).push(getAPIKeysCollection({ pluginConfig }))

    // Keep the API-keys collection registered even when disabled, so DB schema
    // and generated types don't drift between enabled/disabled environments.
    if (pluginConfig.disabled) {
      return config
    }

    return {
      ...config,
      admin: {
        ...config.admin,
        components: {
          ...config.admin?.components,
          userMenuSettingsItems: [
            ...(config.admin?.components?.userMenuSettingsItems ?? []),
            '@payloadcms/plugin-mcp/client#MCPSettingsMenu',
          ],
        },
      },
      endpoints: [
        ...(config.endpoints ?? []),
        // Payload prefixes /api, so the full path is /api/mcp.
        { handler: mcpEndpoint, method: 'post', path: '/mcp' },
      ],
    }
  },
})
