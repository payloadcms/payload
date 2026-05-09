import type { PluginsMap, SanitizedConfig } from 'payload'

import type { MCPPluginConfig } from '../types.js'

/**
 * Get the mcp plugin config from the payload config.
 */
export const getPluginConfig: (args: { config: SanitizedConfig }) => MCPPluginConfig = ({
  config,
}) => {
  const plugin = config.plugins?.find(
    (plugin) => plugin.slug === '@payloadcms/plugin-mcp',
  ) as PluginsMap['@payloadcms/plugin-mcp']

  if (!plugin) {
    throw new Error('MCP Plugin not found in config.plugins.')
  }

  return plugin?.options
}
