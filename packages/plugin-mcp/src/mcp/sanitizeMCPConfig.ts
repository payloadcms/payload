import type {
  CollectionConfig,
  Config,
  GlobalConfig,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import type {
  CollectionTool,
  GlobalTool,
  MCPBuiltInToolOverride,
  MCPItem,
  MCPPluginCollectionConfig,
  MCPPluginConfig,
  MCPPluginGlobalConfig,
  SanitizedMCPPluginConfig,
} from '../types.js'

import {
  COLLECTION_AUTH_BUILTIN_ENTRIES,
  COLLECTION_AUTH_BUILTINS,
  COLLECTION_BUILTIN_ENTRIES,
  COLLECTION_BUILTINS,
  GLOBAL_BUILTIN_ENTRIES,
  GLOBAL_BUILTINS,
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

  for (const [key, tool] of Object.entries(pluginConfig.tools ?? {})) {
    items.push({
      type: 'tool',
      key,
      label: key,
      tool,
    })
  }

  for (const [key, prompt] of Object.entries(pluginConfig.prompts ?? {})) {
    items.push({
      type: 'prompt',
      key,
      label: prompt.title ?? key,
      prompt,
    })
  }

  for (const [key, resource] of Object.entries(pluginConfig.resources ?? {})) {
    items.push({
      type: 'resource',
      key,
      label: resource.title ?? key,
      resource,
    })
  }

  // Mirror Payload's own admin.user detection (sanitize.ts) since plugins run first.
  const firstCollectionWithAuth = config.collections!.find(({ auth }) => Boolean(auth))

  return {
    disabled: pluginConfig.disabled,
    items,
    mcp: pluginConfig.mcp,
    overrideApiKeyCollection: pluginConfig.overrideApiKeyCollection,
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
}): MCPItem[] => {
  if (collection.slug === 'payload-mcp-api-keys') {
    return []
  }
  const slug = collection.slug
  const collectionPluginConfig = pluginConfig.collections?.[slug]
  const items: MCPItem[] = []

  for (const [toolKey, tool] of COLLECTION_BUILTIN_ENTRIES) {
    const matchedConfigEntry = collectionPluginConfig?.tools?.[toolKey]
    if (matchedConfigEntry === false) {
      continue
    }
    items.push({
      type: 'collectionTool',
      collectionSlug: slug,
      key: toolKey,
      label: capitalize(toolKey),
      tool: overrideBuiltinTool(tool, matchedConfigEntry, collectionPluginConfig),
    })
  }

  if (collection.auth) {
    for (const [authToolKey, { label, tool }] of COLLECTION_AUTH_BUILTIN_ENTRIES) {
      const matchedConfigEntry = collectionPluginConfig?.tools?.[authToolKey]
      if (!matchedConfigEntry) {
        continue
      }
      // `true` means "enable, no override"; only the object form carries fields.
      const override = typeof matchedConfigEntry === 'object' ? matchedConfigEntry : undefined
      items.push({
        type: 'collectionTool',
        collectionSlug: slug,
        key: authToolKey,
        label,
        tool: overrideBuiltinTool(tool, override, collectionPluginConfig),
      })
    }
  }

  // Cast: builtin keys are filtered out below, so the remaining values are
  // always custom tools (`CollectionTool`) or undefined
  const customEntries = Object.entries(collectionPluginConfig?.tools ?? {}) as Array<
    [string, CollectionTool | undefined]
  >
  for (const [key, customTool] of customEntries) {
    if (key in COLLECTION_BUILTINS || key in COLLECTION_AUTH_BUILTINS) {
      continue
    }
    if (!customTool) {
      continue
    }
    items.push({
      type: 'collectionTool',
      collectionSlug: slug,
      key,
      label: key,
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
}): MCPItem[] => {
  const slug = global.slug
  const globalPluginConfig = pluginConfig.globals?.[slug]
  const items: MCPItem[] = []

  for (const [toolKey, baseTool] of GLOBAL_BUILTIN_ENTRIES) {
    const matchedConfigEntry = globalPluginConfig?.tools?.[toolKey]
    if (matchedConfigEntry === false) {
      continue
    }
    items.push({
      type: 'globalTool',
      globalSlug: slug,
      key: toolKey,
      label: capitalize(toolKey),
      tool: overrideBuiltinTool(baseTool, matchedConfigEntry, globalPluginConfig),
    })
  }

  const customEntries = Object.entries(globalPluginConfig?.tools ?? {}) as Array<
    [string, GlobalTool | undefined]
  >
  for (const [key, customTool] of customEntries) {
    if (key in GLOBAL_BUILTINS) {
      continue
    }
    if (!customTool) {
      continue
    }
    items.push({
      type: 'globalTool',
      globalSlug: slug,
      key,
      label: key,
      tool: customTool,
    })
  }

  return items
}

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * Spread the static built-in tool and apply consumer-side overrides.
 * Precedence: per-tool override > scope-level (collection/global) override >
 * the static tool's defaults. `toolEntry` is whatever the user put under
 * `tools: { find: ... }` — could be `true`, `false`, or an override object —
 * so it's narrowed internally.
 */
const overrideBuiltinTool = <TTool extends CollectionTool | GlobalTool>(
  tool: TTool,
  toolOverride?: MCPBuiltInToolOverride,
  entityPluginConfig?: TTool extends CollectionTool
    ? MCPPluginCollectionConfig<any>
    : MCPPluginGlobalConfig,
): TTool => {
  return {
    ...tool,
    description: toolOverride?.description ?? entityPluginConfig?.description ?? tool.description,
    overrideResponse:
      toolOverride?.overrideResponse ??
      entityPluginConfig?.overrideResponse ??
      tool.overrideResponse,
  }
}
