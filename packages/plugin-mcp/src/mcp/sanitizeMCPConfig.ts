import type {
  CollectionConfig,
  Config,
  GlobalConfig,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import type {
  CollectionMCPItem,
  CollectionTool,
  GlobalMCPItem,
  GlobalTool,
  MCPItem,
  MCPPluginConfig,
  SanitizedMCPPluginConfig,
} from '../types.js'

import {
  COLLECTION_AUTH_BUILTIN_ENTRIES,
  COLLECTION_AUTH_BUILTINS,
  COLLECTION_BUILTIN_ENTRIES,
  COLLECTION_BUILTINS,
  GLOBAL_BUILTIN_ENTRIES,
  GLOBAL_BUILTINS,
  TOOL_BUILTIN_ENTRIES,
  TOOL_BUILTINS,
} from './builtinTools.js'

/**
 * Converts the user-configured `MCPPluginConfig` into a `SanitizedMCPPluginConfig`:
 *  - Flattens `tools` / `prompts` / `resources` / per-collection / per-global
 *    tool maps into a single `items` array.
 *  - Applies built-in tools for collections and globals, respecting opt-out user overrides.
 *  - Applies the `userCollection` default
 *
 * Called once during plugin init. After that, `plugins['@payloadcms/plugin-mcp']
 * ?.options` holds the sanitized result
 */
export const sanitizeMCPConfig = ({
  config,
  pluginConfig,
}: {
  config: Config | SanitizedConfig
  pluginConfig: MCPPluginConfig
}): SanitizedMCPPluginConfig => {
  const items: MCPItem[] = []

  for (const collection of config.collections ?? []) {
    items.push(...sanitizeCollectionConfig({ collection, pluginConfig }))
  }

  for (const global of config.globals ?? []) {
    items.push(...sanitizeGlobalConfig({ global, pluginConfig }))
  }

  for (const [configKey, { label, mcpName, tool }] of TOOL_BUILTIN_ENTRIES) {
    items.push({
      type: 'tool',
      configKey,
      label,
      mcpName,
      tool,
    })
  }

  for (const [configKey, tool] of Object.entries(pluginConfig.tools ?? {})) {
    if (configKey in TOOL_BUILTINS) {
      continue
    }
    items.push({
      type: 'tool',
      configKey,
      label: configKey,
      mcpName: configKey,
      tool,
    })
  }

  for (const [configKey, prompt] of Object.entries(pluginConfig.prompts ?? {})) {
    items.push({
      type: 'prompt',
      configKey,
      label: prompt.title ?? configKey,
      mcpName: configKey,
      prompt,
    })
  }

  for (const [configKey, resource] of Object.entries(pluginConfig.resources ?? {})) {
    items.push({
      type: 'resource',
      configKey,
      label: resource.title ?? configKey,
      mcpName: configKey,
      resource,
    })
  }

  // Mirror Payload's own admin.user detection (sanitize.ts) since plugins run first.
  const firstCollectionWithAuth = config.collections?.find(({ auth }) => Boolean(auth))

  return {
    disabled: pluginConfig.disabled,
    items,
    mcp: pluginConfig.mcp,
    overrideAuth: pluginConfig.overrideAuth,
    userCollection:
      pluginConfig.userCollection ?? config.admin?.user ?? firstCollectionWithAuth?.slug ?? 'users',
  }
}

const sanitizeCollectionConfig = ({
  collection,
  pluginConfig,
}: {
  collection: CollectionConfig | SanitizedCollectionConfig
  pluginConfig: MCPPluginConfig
}): CollectionMCPItem[] => {
  const slug = collection.slug
  const collectionPluginConfig = pluginConfig.collections?.[slug]
  const items: CollectionMCPItem[] = []

  for (const [toolKey, { mcpName, tool }] of COLLECTION_BUILTIN_ENTRIES) {
    const matchedConfigEntry = collectionPluginConfig?.tools?.[toolKey]
    if (matchedConfigEntry === false) {
      continue
    }
    const override = typeof matchedConfigEntry === 'object' ? matchedConfigEntry : undefined
    items.push({
      type: 'collectionTool',
      collectionSlug: slug,
      configKey: toolKey,
      label: capitalize(toolKey),
      mcpName,
      tool: {
        ...tool,
        access: override?.access,
        description: override?.description ?? tool.description,
        overrideResponse:
          override?.overrideResponse ??
          collectionPluginConfig?.overrideResponse ??
          tool.overrideResponse,
      },
    })
  }

  if (collection.auth) {
    for (const [authToolKey, { label, mcpName, tool }] of COLLECTION_AUTH_BUILTIN_ENTRIES) {
      const matchedConfigEntry = collectionPluginConfig?.tools?.[authToolKey]
      if (!matchedConfigEntry) {
        continue
      }
      // `true` means "enable, no override"; only the object form carries fields.
      const override = typeof matchedConfigEntry === 'object' ? matchedConfigEntry : undefined
      items.push({
        type: 'collectionTool',
        collectionSlug: slug,
        configKey: authToolKey,
        label,
        mcpName,
        tool: {
          ...tool,
          access: override?.access,
          description: override?.description ?? tool.description,
          overrideResponse:
            override?.overrideResponse ??
            collectionPluginConfig?.overrideResponse ??
            tool.overrideResponse,
        },
      })
    }
  }

  // Cast: builtin keys are filtered out below, so the remaining values are
  // always custom tools (`CollectionTool`) or undefined
  const customEntries = Object.entries(collectionPluginConfig?.tools ?? {}) as Array<
    [string, CollectionTool | undefined]
  >
  for (const [configKey, customTool] of customEntries) {
    if (configKey in COLLECTION_BUILTINS || configKey in COLLECTION_AUTH_BUILTINS) {
      continue
    }
    if (!customTool) {
      continue
    }
    items.push({
      type: 'collectionTool',
      collectionSlug: slug,
      configKey,
      label: configKey,
      mcpName: configKey,
      tool: customTool,
    })
  }

  return items
}

const sanitizeGlobalConfig = ({
  global,
  pluginConfig,
}: {
  global: GlobalConfig | SanitizedGlobalConfig
  pluginConfig: MCPPluginConfig
}): GlobalMCPItem[] => {
  const slug = global.slug
  const globalPluginConfig = pluginConfig.globals?.[slug]
  const items: GlobalMCPItem[] = []

  for (const [toolKey, { mcpName, tool }] of GLOBAL_BUILTIN_ENTRIES) {
    const matchedConfigEntry = globalPluginConfig?.tools?.[toolKey]
    if (matchedConfigEntry === false) {
      continue
    }
    const override = typeof matchedConfigEntry === 'object' ? matchedConfigEntry : undefined
    items.push({
      type: 'globalTool',
      configKey: toolKey,
      globalSlug: slug,
      label: capitalize(toolKey),
      mcpName,
      tool: {
        ...tool,
        access: override?.access,
        description: override?.description ?? tool.description,
        overrideResponse:
          override?.overrideResponse ??
          globalPluginConfig?.overrideResponse ??
          tool.overrideResponse,
      },
    })
  }

  const customEntries = Object.entries(globalPluginConfig?.tools ?? {}) as Array<
    [string, GlobalTool | undefined]
  >
  for (const [configKey, customTool] of customEntries) {
    if (configKey in GLOBAL_BUILTINS) {
      continue
    }
    if (!customTool) {
      continue
    }
    items.push({
      type: 'globalTool',
      configKey,
      globalSlug: slug,
      label: configKey,
      mcpName: configKey,
      tool: customTool,
    })
  }

  return items
}

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)
