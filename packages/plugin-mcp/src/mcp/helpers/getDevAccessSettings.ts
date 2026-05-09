import type { TypedUser } from 'payload'

import type { MCPAccessSettings, MCPPluginConfig } from '../../types.js'

import { toCamelCase } from '../../utils/camelCase.js'
import { getEnabledSlugs } from '../../utils/getEnabledSlugs.js'

/**
 * Builds full-access MCP access settings for development mode.
 * Grants every operation that is enabled in the plugin config; the optional `user` is
 * passed through to tool handlers but is not required because the dev bypass forces
 * `overrideAccess: true` on the underlying local API calls.
 */
export const getDevAccessSettings = (
  pluginOptions: MCPPluginConfig,
  user: null | TypedUser,
): MCPAccessSettings => {
  const settings: Record<string, unknown> = { user }

  for (const slug of getEnabledSlugs(pluginOptions.collections, 'collection')) {
    settings[toCamelCase(slug)] = {
      create: true,
      delete: true,
      find: true,
      update: true,
    }
  }

  for (const slug of getEnabledSlugs(pluginOptions.globals, 'global')) {
    settings[toCamelCase(slug)] = {
      find: true,
      update: true,
    }
  }

  if (pluginOptions.mcp?.tools?.length) {
    settings['payload-mcp-tool'] = Object.fromEntries(
      pluginOptions.mcp.tools.map((tool) => [toCamelCase(tool.name), true]),
    )
  }

  if (pluginOptions.mcp?.prompts?.length) {
    settings['payload-mcp-prompt'] = Object.fromEntries(
      pluginOptions.mcp.prompts.map((prompt) => [toCamelCase(prompt.name), true]),
    )
  }

  if (pluginOptions.mcp?.resources?.length) {
    settings['payload-mcp-resource'] = Object.fromEntries(
      pluginOptions.mcp.resources.map((resource) => [toCamelCase(resource.name), true]),
    )
  }

  const experimental = pluginOptions.experimental?.tools
  if (experimental?.auth?.enabled) {
    settings.auth = {
      auth: true,
      forgotPassword: true,
      login: true,
      resetPassword: true,
      unlock: true,
      verify: true,
    }
  }

  settings.overrideAccess = true

  return settings as MCPAccessSettings
}
