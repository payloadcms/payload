import { defaultUserCollection, definePlugin } from 'payload'

import type { AuthorizedMCP, MCPPluginConfig, SanitizedMCPPluginConfig } from './types.js'

import type { RuntimeTool } from './mcp/runtimeTools.js'

import { getAPIKeysCollection } from './collection/index.js'
import { sanitizeMCPConfig } from './mcp/sanitizeMCPConfig.js'
import { mcpEndpoint, reconcileSessions } from './transports/http/index.js'
import { addRuntimeTool } from './transports/http/runtimeTools.js'

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
export type { RuntimeTool }

export { addRuntimeTool }

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
      endpoints: [
        ...(config.endpoints ?? []),
        // /api/mcp — POST for requests, GET for the notification stream, DELETE to end a session.
        { handler: mcpEndpoint, method: 'post', path: '/mcp' },
        { handler: mcpEndpoint, method: 'get', path: '/mcp' },
        { handler: mcpEndpoint, method: 'delete', path: '/mcp' },
      ],
      // On dev HMR config change, reconcile live sessions' tools and push list_changed.
      onReload: [...(config.onReload ?? []), reconcileSessions],
    }
  },
})
