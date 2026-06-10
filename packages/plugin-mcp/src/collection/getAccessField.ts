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
): ClientMCPPluginConfig => {
  const items: ClientMCPPluginConfig['items'] = []

  for (const item of pluginConfig.items) {
    if (item.type === 'collectionTool') {
      items.push({
        type: item.type,
        collectionSlug: item.collectionSlug,
        configKey: item.configKey,
        description: itemDescription(item),
        label: item.label,
      })
      continue
    }

    if (item.type === 'globalTool') {
      items.push({
        type: item.type,
        configKey: item.configKey,
        description: itemDescription(item),
        globalSlug: item.globalSlug,
        label: item.label,
      })
      continue
    }

    items.push({
      type: item.type,
      configKey: item.configKey,
      description: itemDescription(item),
      label: item.label,
    })
  }

  return { items }
}

const itemDescription = (item: MCPItem): string => {
  if (item.type === 'prompt') {
    return item.prompt.description
  }
  if (item.type === 'resource') {
    return item.resource.description
  }
  return item.tool.description
}
