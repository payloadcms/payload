import type { JSONField } from 'payload'

import type { ClientMCPPluginConfig, MCPItem, SanitizedMCPPluginConfig } from '../types.js'

import {
  COLLECTION_AUTH_BUILTINS,
  COLLECTION_BUILTINS,
  GLOBAL_BUILTINS,
} from '../mcp/builtinTools.js'

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
    },
    defaultValue: {},
    label: false,
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
  items: pluginConfig.items.map((item) => {
    const group = itemGroup(item)

    return {
      ...(item.type === 'collectionTool' ? { collectionSlug: item.collectionSlug } : {}),
      ...(item.type === 'globalTool' ? { globalSlug: item.globalSlug } : {}),
      type: item.type,
      configKey: item.configKey,
      ...(group === 'operations' ? {} : { description: itemDescription(item) }),
      group,
      label: item.label,
    }
  }),
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

const itemGroup = (item: MCPItem): 'auth' | 'custom' | 'operations' | undefined => {
  if (item.type === 'collectionTool') {
    if (item.configKey in COLLECTION_BUILTINS) {
      return 'operations'
    }
    return item.configKey in COLLECTION_AUTH_BUILTINS ? 'auth' : 'custom'
  }
  if (item.type === 'globalTool') {
    return item.configKey in GLOBAL_BUILTINS ? 'operations' : 'custom'
  }
  return undefined
}
