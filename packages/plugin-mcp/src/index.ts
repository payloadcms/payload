import type { Config } from 'payload'

import type { PluginMCPServerConfig } from './types.js'

import { initializeMCPHandler } from './endpoints/mcp.js'
import { createMCPToolsGlobal } from './globals/createMCPToolsGlobal.js'

export const pluginMCP =
  (pluginOptions: PluginMCPServerConfig) =>
  (config: Config): Config => {
    if (!config.globals) {
      config.globals = []
    }

    // Extract custom tools for the global config
    const customTools =
      pluginOptions.mcp?.tools?.map((tool) => ({
        name: tool.name,
        description: tool.description,
      })) || []

    const experimentalTools = pluginOptions?._experimental?.tools || {}

    // Add MCP globals.
    config.globals.push(createMCPToolsGlobal(customTools, experimentalTools))

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

    // This is the primary MCP Server Endpoint.
    // Payload will automatically add the /api prefix to the path, so the full path is `/api/mcp`
    // NOTE: This is only transport method until we add full support for SSE which will be another endpoint at `/api/sse`
    config.endpoints.push({
      handler: initializeMCPHandler(pluginOptions),
      method: 'post',
      path: '/mcp',
    })

    // The GET response is always: {"jsonrpc":"2.0","error":{"code":-32000,"message":"Method not allowed."},"id":null}
    // This is expected behavior and MCP clients should always use the POST endpoint.
    config.endpoints.push({
      handler: initializeMCPHandler(pluginOptions),
      method: 'get',
      path: '/mcp',
    })

    return config
  }
