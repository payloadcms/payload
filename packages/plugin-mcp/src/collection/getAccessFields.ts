import type { Config, Field, GroupField, SanitizedConfig } from 'payload'

import type { MCPPluginConfig } from '../types.js'

/** Loose shape walker uses to iterate any scope's tools map without caring about variant. */
type AnyToolsMap = Record<string, unknown>

import { classifyEntry, getCustomToolNames } from '../mcp/classifyEntry.js'
import {
  COLLECTION_BUILTIN_AUTH_TOOL_KEYS,
  COLLECTION_BUILTIN_TOOL_KEYS,
  GLOBAL_BUILTIN_TOOL_KEYS,
} from '../mcp/constants.js'
import { toCamelCase } from '../utils/camelCase.js'

const AUTH_TOOL_LABELS: Record<string, string> = {
  auth: 'Check Auth Status',
  forgotPassword: 'Forgot Password',
  login: 'User Login',
  resetPassword: 'Reset Password',
  unlock: 'Unlock Account',
  verify: 'Email Verification',
}

const HARD_EXCLUDED_SLUGS = new Set(['payload-mcp-api-keys'])

/**
 * Returns the API key collection's `access` field — a single top-level `group`
 * field with nested groups matching the runtime access tree:
 *
 * ```
 * access: {
 *   collections: { posts: { find, create, update, delete, sendNewsletter? } },
 *   globals: { site-settings: { find, update } },
 *   tools: { checkAppHealth?, ... },
 *   prompts: { echo?, ... },
 *   resources: { data?, ... },
 * }
 * ```
 *
 * Admins can audit a key's full exposure by looking at one place, and the
 * stored document's `access` is the exact shape the runtime consults.
 */
export const getAccessGroupField = ({
  config,
  pluginConfig,
}: {
  config: Config | SanitizedConfig
  pluginConfig: MCPPluginConfig
}): GroupField => {
  const fields: Field[] = []

  const collectionsGroup = buildCollectionsGroup({ config, pluginConfig })
  if (collectionsGroup) {
    fields.push(collectionsGroup)
  }

  const globalsGroup = buildGlobalsGroup({ config, pluginConfig })
  if (globalsGroup) {
    fields.push(globalsGroup)
  }

  const topToolsGroup = buildTopLevelGroup({
    name: 'tools',
    description: 'Top-level (cross-cutting) tools',
    label: 'Tools',
    map: pluginConfig.tools,
  })
  if (topToolsGroup) {
    fields.push(topToolsGroup)
  }

  const promptsGroup = buildPromptsResourcesGroup({
    name: 'prompts',
    description: 'Manage client access to prompts',
    items: pluginConfig.prompts,
    label: 'Prompts',
  })
  if (promptsGroup) {
    fields.push(promptsGroup)
  }

  const resourcesGroup = buildPromptsResourcesGroup({
    name: 'resources',
    description: 'Manage client access to resources',
    items: pluginConfig.resources,
    label: 'Resources',
  })
  if (resourcesGroup) {
    fields.push(resourcesGroup)
  }

  return {
    name: 'access',
    type: 'group',
    admin: {
      description: 'Access for this API key — uncheck to revoke individual tools.',
    },
    fields,
    label: 'Access',
  }
}

const buildCollectionsGroup = ({
  config,
  pluginConfig,
}: {
  config: Config | SanitizedConfig
  pluginConfig: MCPPluginConfig
}): GroupField | null => {
  const slugFields: Field[] = []

  for (const collection of config.collections ?? []) {
    const slug = collection.slug
    if (HARD_EXCLUDED_SLUGS.has(slug)) {
      continue
    }
    const entry = pluginConfig.collections?.[slug]
    const tools = entry?.tools ?? {}

    const checkboxes: Field[] = []
    for (const op of COLLECTION_BUILTIN_TOOL_KEYS) {
      const classified = classifyEntry(tools[op])
      if (classified.kind === 'disabled') {
        continue
      }
      checkboxes.push({
        name: op,
        type: 'checkbox',
        admin: { description: `Allow clients to ${op} ${slug}.` },
        defaultValue: true,
        label: op.charAt(0).toUpperCase() + op.slice(1),
      })
    }

    // Opt-in auth tools — only show a checkbox if the plugin config enabled the tool.
    if (collection.auth) {
      for (const authToolName of COLLECTION_BUILTIN_AUTH_TOOL_KEYS) {
        const classified = classifyEntry(tools[authToolName])
        const enabled = classified.kind === 'enabled' || classified.kind === 'override'
        if (!enabled) {
          continue
        }
        const override = classified.kind === 'override' ? classified.value : undefined
        checkboxes.push({
          name: authToolName,
          type: 'checkbox',
          admin: {
            description:
              override?.description ?? `Allow clients to use ${authToolName} on ${slug}.`,
          },
          defaultValue: true,
          label: AUTH_TOOL_LABELS[authToolName] ?? authToolName,
        })
      }
    }

    for (const toolName of getCustomToolNames(tools)) {
      if (COLLECTION_BUILTIN_TOOL_KEYS.includes(toolName)) {
        continue
      }
      if (collection.auth && COLLECTION_BUILTIN_AUTH_TOOL_KEYS.includes(toolName)) {
        continue
      }
      const tool = (tools[toolName] as { description?: string }) ?? {}
      checkboxes.push({
        name: toolName,
        type: 'checkbox',
        admin: { description: tool.description ?? `Allow clients to call ${toolName}.` },
        defaultValue: true,
        label: toolName,
      })
    }

    if (checkboxes.length === 0) {
      continue
    }

    slugFields.push({
      name: toCamelCase(slug),
      type: 'group',
      fields: checkboxes,
      label: slug.charAt(0).toUpperCase() + toCamelCase(slug).slice(1),
    })
  }

  if (slugFields.length === 0) {
    return null
  }

  return {
    name: 'collections',
    type: 'group',
    fields: slugFields,
    label: 'Collections',
  }
}

const buildGlobalsGroup = ({
  config,
  pluginConfig,
}: {
  config: Config | SanitizedConfig
  pluginConfig: MCPPluginConfig
}): GroupField | null => {
  const slugFields: Field[] = []

  for (const global of config.globals ?? []) {
    const slug = global.slug
    const entry = pluginConfig.globals?.[slug]
    const tools: AnyToolsMap = (entry?.tools ?? {}) as AnyToolsMap

    const checkboxes: Field[] = []
    for (const tool of GLOBAL_BUILTIN_TOOL_KEYS) {
      const classified = classifyEntry(tools[tool])
      if (classified.kind === 'disabled') {
        continue
      }
      checkboxes.push({
        name: tool,
        type: 'checkbox',
        admin: { description: `Allow clients to ${tool} ${slug} global.` },
        defaultValue: true,
        label: tool.charAt(0).toUpperCase() + tool.slice(1),
      })
    }

    for (const toolName of getCustomToolNames(tools)) {
      if (GLOBAL_BUILTIN_TOOL_KEYS.includes(toolName)) {
        continue
      }
      const tool = (tools[toolName] as { description?: string }) ?? {}
      checkboxes.push({
        name: toolName,
        type: 'checkbox',
        admin: { description: tool.description ?? `Allow clients to call ${toolName}.` },
        defaultValue: true,
        label: toolName,
      })
    }

    if (checkboxes.length === 0) {
      continue
    }

    slugFields.push({
      name: toCamelCase(slug),
      type: 'group',
      fields: checkboxes,
      label: slug.charAt(0).toUpperCase() + toCamelCase(slug).slice(1),
    })
  }

  if (slugFields.length === 0) {
    return null
  }

  return {
    name: 'globals',
    type: 'group',
    fields: slugFields,
    label: 'Globals',
  }
}

const buildTopLevelGroup = ({
  name,
  description,
  label,
  map,
}: {
  description: string
  label: string
  map: AnyToolsMap | undefined
  name: string
}): GroupField | null => {
  const customNames = getCustomToolNames(map)
  if (customNames.length === 0) {
    return null
  }
  return {
    name,
    type: 'group',
    admin: { description },
    fields: customNames.map((toolName) => {
      const tool = (map?.[toolName] as { description?: string }) ?? {}
      return {
        name: toolName,
        type: 'checkbox',
        admin: { description: tool.description ?? `Allow clients to call ${toolName}.` },
        defaultValue: true,
        label: toolName,
      }
    }),
    label,
  }
}

const buildPromptsResourcesGroup = <T extends { description?: string; title?: string }>({
  name,
  description,
  items,
  label,
}: {
  description: string
  items: Record<string, T> | undefined
  label: string
  name: string
}): GroupField | null => {
  if (!items || Object.keys(items).length === 0) {
    return null
  }
  return {
    name,
    type: 'group',
    admin: { description },
    fields: Object.entries(items).map(([itemName, item]) => ({
      name: itemName,
      type: 'checkbox',
      admin: { description: item.description ?? `Allow clients to use ${itemName}.` },
      defaultValue: true,
      label: item.title ?? itemName,
    })),
    label,
  }
}
