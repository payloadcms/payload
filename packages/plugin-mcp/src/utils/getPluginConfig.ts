import type { PluginsMap, SanitizedConfig } from 'payload'

import type { SanitizedMCPPluginConfig } from '../types.js'
/**
 * Finds the sanitized plugin config, if `mcpPlugin()` is installed.
 */
export const findPluginConfig: (args: {
  config: SanitizedConfig
}) => SanitizedMCPPluginConfig | undefined = ({ config }) => {
  const plugin = config.plugins?.find((plugin) => plugin.slug === '@payloadcms/plugin-mcp') as
    | PluginsMap['@payloadcms/plugin-mcp']
    | undefined

  // @ts-expect-error -- mcpPlugin() stores the sanitized config on the registered plugin.
  return plugin?.sanitizedOptions
}

/**
 * Returns the sanitized plugin config — the form produced by
 * `sanitizeMCPConfig` and stashed back on the plugin's `options` during init.
 */
export const getPluginConfig = ({
  config,
}: {
  config: SanitizedConfig
}): SanitizedMCPPluginConfig => {
  const pluginConfig = findPluginConfig({ config })

  if (!pluginConfig) {
    throw new Error('MCP Plugin not found in config.plugins.')
  }

  return pluginConfig
}
