import type { PluginsMap, SanitizedConfig } from 'payload'

import type { SanitizedMCPPluginConfig } from '../types.js'

/**
 * Returns the sanitized plugin config — the form produced by
 * `sanitizeMCPConfig` and stashed back on the plugin's `options` during init.
 * Callers downstream of plugin init can rely on `items` and other defaults
 * being fully resolved.
 */
export const getPluginConfig: (args: { config: SanitizedConfig }) => SanitizedMCPPluginConfig = ({
  config,
}) => {
  const plugin = config.plugins?.find(
    (plugin) => plugin.slug === '@payloadcms/plugin-mcp',
  ) as PluginsMap['@payloadcms/plugin-mcp']

  if (!plugin) {
    throw new Error('MCP Plugin not found in config.plugins.')
  }

  // @ts-expect-error
  return plugin.sanitizedOptions
}
