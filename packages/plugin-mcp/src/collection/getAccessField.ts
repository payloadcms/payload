import type { JSONField } from 'payload'

import type { ClientMCPPluginConfig, MCPItem, SanitizedMCPPluginConfig } from '../types.js'

/**
 * Returns the API key collection's `access` field — a JSON field whose value
 * is the `MCPAPIKeysDocAccessTree` the endpoint consults. The actual UI is
 * a custom client component (`AccessField`) which renders a permissions
 * matrix; the field's stored shape is just the runtime access tree.
 */
export const getAccessField = ({
  pluginConfig,
}: {
  pluginConfig: SanitizedMCPPluginConfig
}): JSONField => {
  const clientPluginConfig = sanitizeClientPluginConfig(pluginConfig)

  return {
    name: 'access',
    type: 'json',
    admin: {
      components: {
        Field: {
          clientProps: { pluginConfig: clientPluginConfig },
          path: '@payloadcms/plugin-mcp/client#AccessField',
        },
      },
      // TODO: needs i18n once design is finalized
      description: 'Access for this API key — uncheck to revoke individual tools.',
      position: 'sidebar',
    },
    defaultValue: {},
    // TODO: needs i18n once design is finalized
    label: 'Access',
  }
}

/**
 * Strips the non-serializable parts of `SanitizedMCPPluginConfig` (handlers,
 * input/argsSchema functions, etc.) so the result is safe to thread to a
 * client component via `clientProps`.
 */
const sanitizeClientPluginConfig = (
  pluginConfig: SanitizedMCPPluginConfig,
): ClientMCPPluginConfig => ({
  items: pluginConfig.items.map((item) => ({
    ...(item.type === 'collectionTool' ? { collectionSlug: item.collectionSlug } : {}),
    ...(item.type === 'globalTool' ? { globalSlug: item.globalSlug } : {}),
    type: item.type,
    description: itemDescription(item),
    key: item.key,
    label: item.label,
  })),
})

const itemDescription = (item: MCPItem): string => {
  if (item.type === 'prompt') {
    return item.prompt.description
  }
  if (item.type === 'resource') {
    return item.resource.description
  }
  return item.tool.description
}
