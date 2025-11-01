import type { Config } from 'payload'

import type { PluginMCPServerConfig } from './types.js'

import { createAPIKeysCollection } from './collections/createApiKeysCollection.js'
import { initializeMCPHandler } from './endpoints/mcp.js'

/**
 * The MCP Plugin for Payload. This plugin allows you to add MCP capabilities to your Payload project.
 *
 * @param pluginOptions - The options for the MCP plugin.
 * @experimental This plugin is experimental and may change in the future.
 */
export const mcpPlugin =
  (pluginOptions: PluginMCPServerConfig) =>
  (config: Config): Config => {
    if (!config.collections) {
      config.collections = []
    }

    // Collections
    const collections = pluginOptions.collections || {}
    // Globals
    const globals = pluginOptions.globals || {}
    // Extract custom tools for the global config
    const customTools =
      pluginOptions.mcp?.tools?.map((tool) => ({
        name: tool.name,
        description: tool.description,
      })) || []

    const experimentalTools = pluginOptions?.experimental?.tools || {}

    /**
     * API Keys
     * --------
     * High resolution control over MCP capabilities is crucial when using Payload with LLMs.
     *
     * This API Keys collection has ways for admins to create API keys and allow or disallow the MCP capabilities.
     * This is useful when Admins want to allow or disallow the use of the MCP capabilities in real time.
     * For example:
     *  - If a collection has all of its capabilities enabled, admins can allow or disallow the create, update, delete, and find capabilities on that collection.
     *  - If a collection only has the find capability enabled, admins can only allow or disallow the find capability on that collection.
     *  - If a global has all of its capabilities enabled, admins can allow or disallow the find and update capabilities on that global.
     *  - If a custom tool has gone haywire, admins can disallow that tool.
     *
     */
    const apiKeyCollection = createAPIKeysCollection(
      collections,
      globals,
      customTools,
      experimentalTools,
    )
    if (pluginOptions.overrideApiKeyCollection) {
      config.collections.push(pluginOptions.overrideApiKeyCollection(apiKeyCollection))
    } else {
      config.collections.push(apiKeyCollection)
    }

    /**
     * If the plugin is disabled, we still want to keep added collections/fields so the database schema is consistent which is important for migrations.
     * If your plugin heavily modifies the database schema, you may want to remove this property.
     */
    if (pluginOptions.disabled) {
      return config
    }

    if (!config.endpoints) {
      config.endpoints = []
    }

    /**
     * This is the primary MCP Server Endpoint.
     * Payload will automatically add the /api prefix to the path, so the full path is `/api/mcp`
     * NOTE: This is only transport method until we add full support for SSE which will be another endpoint at `/api/sse`
     */
    config.endpoints.push({
      handler: initializeMCPHandler(pluginOptions),
      method: 'post',
      path: '/mcp',
    })

    /**
     * The GET response is always: {"jsonrpc":"2.0","error":{"code":-32000,"message":"Method not allowed."},"id":null} -- even with an API key
     * This is expected behavior and MCP clients should always use the POST endpoint.
     */
    config.endpoints.push({
      handler: initializeMCPHandler(pluginOptions),
      method: 'get',
      path: '/mcp',
    })

    return config
  }
