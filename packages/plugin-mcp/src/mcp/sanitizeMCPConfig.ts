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

import { defaultAccess } from '../defaultAccess.js'
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

  for (const [configKey, { mcpName, tool }] of TOOL_BUILTIN_ENTRIES) {
    items.push({
      type: 'tool',
      configKey,
      label: tool.annotations?.title ?? configKey,
      mcpName,
      tool: { ...tool, access: tool.access ?? defaultAccess },
    })
  }

  for (const [configKey, tool] of Object.entries(pluginConfig.tools ?? {})) {
    if (configKey in TOOL_BUILTINS) {
      continue
    }
    items.push({
      type: 'tool',
      configKey,
      label: tool.annotations?.title ?? configKey,
      mcpName: configKey,
      tool: { ...tool, access: tool.access ?? defaultAccess },
    })
  }

  for (const [configKey, prompt] of Object.entries(pluginConfig.prompts ?? {})) {
    items.push({
      type: 'prompt',
      configKey,
      label: prompt.title ?? configKey,
      mcpName: configKey,
      prompt: { ...prompt, access: prompt.access ?? defaultAccess },
    })
  }

  for (const [configKey, resource] of Object.entries(pluginConfig.resources ?? {})) {
    items.push({
      type: 'resource',
      configKey,
      label: resource.title ?? configKey,
      mcpName: configKey,
      resource: { ...resource, access: resource.access ?? defaultAccess },
    })
  }

  return {
    disabled: pluginConfig.disabled,
    items,
    mcp: pluginConfig.mcp,
    overrideGetAuthorizedMCP: pluginConfig.overrideGetAuthorizedMCP,
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
    const annotations = { ...tool.annotations, ...override?.annotations }
    items.push({
      type: 'collectionTool',
      collectionSlug: slug,
      configKey: toolKey,
      label: annotations.title ?? toolKey,
      mcpName,
      tool: {
        ...tool,
        access: override?.access ?? tool.access ?? defaultAccess,
        annotations,
        description: override?.description ?? tool.description,
        overrideResponse:
          override?.overrideResponse ??
          collectionPluginConfig?.overrideResponse ??
          tool.overrideResponse,
      },
    })
  }

  if (collection.auth) {
    for (const [authToolKey, { mcpName, tool }] of COLLECTION_AUTH_BUILTIN_ENTRIES) {
      const matchedConfigEntry = collectionPluginConfig?.tools?.[authToolKey]
      if (!matchedConfigEntry) {
        continue
      }
      // `true` means "enable, no override"; only the object form carries fields.
      const override = typeof matchedConfigEntry === 'object' ? matchedConfigEntry : undefined
      const annotations = { ...tool.annotations, ...override?.annotations }
      items.push({
        type: 'collectionTool',
        collectionSlug: slug,
        configKey: authToolKey,
        label: annotations.title ?? authToolKey,
        mcpName,
        tool: {
          ...tool,
          access: override?.access ?? tool.access ?? defaultAccess,
          annotations,
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
      label: customTool.annotations?.title ?? configKey,
      mcpName: configKey,
      tool: { ...customTool, access: customTool.access ?? defaultAccess },
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
    const annotations = { ...tool.annotations, ...override?.annotations }
    items.push({
      type: 'globalTool',
      configKey: toolKey,
      globalSlug: slug,
      label: annotations.title ?? toolKey,
      mcpName,
      tool: {
        ...tool,
        access: override?.access ?? tool.access ?? defaultAccess,
        annotations,
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
      label: customTool.annotations?.title ?? configKey,
      mcpName: configKey,
      tool: { ...customTool, access: customTool.access ?? defaultAccess },
    })
  }

  return items
}
