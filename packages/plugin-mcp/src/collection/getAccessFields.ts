import type { Config, Field, GroupField, SanitizedConfig } from 'payload'

import type { MCPPluginConfig } from '../types.js'

import {
  COLLECTION_BUILTIN_AUTH_TOOL_KEYS,
  COLLECTION_BUILTIN_TOOL_KEYS,
  GLOBAL_BUILTIN_TOOL_KEYS,
  HARD_EXCLUDED_COLLECTION_SLUGS,
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

  const topToolsGroup = buildTopLevelGroup({ pluginConfig })
  if (topToolsGroup) {
    fields.push(topToolsGroup)
  }

  const promptsGroup = buildPromptsGroup({ pluginConfig })
  if (promptsGroup) {
    fields.push(promptsGroup)
  }

  const resourcesGroup = buildResourcesGroup({ pluginConfig })
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
    if (HARD_EXCLUDED_COLLECTION_SLUGS.includes(collection.slug)) {
      continue
    }
    const tools = (pluginConfig.collections?.[collection.slug]?.tools ?? {}) as Record<
      string,
      unknown
    >
    const checkboxes: Field[] = []

    for (const toolKey of COLLECTION_BUILTIN_TOOL_KEYS) {
      const matchedConfigEntry = tools[toolKey]
      if (matchedConfigEntry === false) {
        continue
      }
      // Built-in tools are opt-out
      checkboxes.push({
        name: toolKey,
        type: 'checkbox',
        admin: { description: `Allow clients to ${toolKey} ${collection.slug}.` },
        defaultValue: true,
        label: toolKey.charAt(0).toUpperCase() + toolKey.slice(1),
      })
    }

    if (collection.auth) {
      for (const authToolKey of COLLECTION_BUILTIN_AUTH_TOOL_KEYS) {
        const matchedConfigEntry = tools[authToolKey]
        if (!matchedConfigEntry) {
          // auth is opt-in — skip if plugin config didn't enable it
          continue
        }
        const override =
          typeof matchedConfigEntry === 'object'
            ? (matchedConfigEntry as { description?: string })
            : undefined
        checkboxes.push({
          name: authToolKey,
          type: 'checkbox',
          admin: {
            description:
              override?.description ?? `Allow clients to use ${authToolKey} on ${collection.slug}.`,
          },
          defaultValue: true,
          label: AUTH_TOOL_LABELS[authToolKey] ?? authToolKey,
        })
      }
    }

    const customTools = Object.entries(tools).filter(
      ([key]) =>
        !COLLECTION_BUILTIN_TOOL_KEYS.includes(key) && !COLLECTION_BUILTIN_AUTH_TOOL_KEYS.includes(key),
    )
    for (const [key, customTool] of customTools) {
      if (customTool === false) {
        continue
      }
      const description = (customTool as { description?: string })?.description
      checkboxes.push({
        name: key,
        type: 'checkbox',
        admin: { description: description ?? `Allow clients to call ${key}.` },
        defaultValue: true,
        label: key,
      })
    }

    if (checkboxes.length === 0) {
      continue
    }
    slugFields.push({
      name: toCamelCase(collection.slug),
      type: 'group',
      fields: checkboxes,
      label: collection.slug.charAt(0).toUpperCase() + toCamelCase(collection.slug).slice(1),
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
    const tools = (pluginConfig.globals?.[global.slug]?.tools ?? {}) as Record<string, unknown>
    const checkboxes: Field[] = []

    for (const toolKey of GLOBAL_BUILTIN_TOOL_KEYS) {
      const matchedConfigEntry = tools[toolKey]
      if (matchedConfigEntry === false) {
        continue
      }
      // Built-in tools are opt-out
      checkboxes.push({
        name: toolKey,
        type: 'checkbox',
        admin: { description: `Allow clients to ${toolKey} ${global.slug} global.` },
        defaultValue: true,
        label: toolKey.charAt(0).toUpperCase() + toolKey.slice(1),
      })
    }

    const customTools = Object.entries(tools).filter(([key]) => !GLOBAL_BUILTIN_TOOL_KEYS.includes(key))
    for (const [key, customTool] of customTools) {
      if (customTool === false) {
        continue
      }
      const description = (customTool as { description?: string })?.description
      checkboxes.push({
        name: key,
        type: 'checkbox',
        admin: { description: description ?? `Allow clients to call ${key}.` },
        defaultValue: true,
        label: key,
      })
    }

    if (checkboxes.length === 0) {
      continue
    }
    slugFields.push({
      name: toCamelCase(global.slug),
      type: 'group',
      fields: checkboxes,
      label: global.slug.charAt(0).toUpperCase() + toCamelCase(global.slug).slice(1),
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
  pluginConfig,
}: {
  pluginConfig: MCPPluginConfig
}): GroupField | null => {
  const checkboxes: Field[] = []
  for (const [key, customTool] of Object.entries(pluginConfig.tools ?? {})) {
    if ((customTool as unknown) === false) {
      continue
    }
    const description = customTool?.description
    checkboxes.push({
      name: key,
      type: 'checkbox',
      admin: { description: description ?? `Allow clients to call ${key}.` },
      defaultValue: true,
      label: key,
    })
  }
  if (checkboxes.length === 0) {
    return null
  }
  return {
    name: 'tools',
    type: 'group',
    admin: { description: 'Top-level (cross-cutting) tools' },
    fields: checkboxes,
    label: 'Tools',
  }
}

const buildPromptsGroup = ({
  pluginConfig,
}: {
  pluginConfig: MCPPluginConfig
}): GroupField | null => {
  const checkboxes: Field[] = []
  for (const [key, prompt] of Object.entries(pluginConfig.prompts ?? {})) {
    checkboxes.push({
      name: key,
      type: 'checkbox',
      admin: { description: prompt.description ?? `Allow clients to use ${key}.` },
      defaultValue: true,
      label: prompt.title ?? key,
    })
  }
  if (checkboxes.length === 0) {
    return null
  }
  return {
    name: 'prompts',
    type: 'group',
    admin: { description: 'Manage client access to prompts' },
    fields: checkboxes,
    label: 'Prompts',
  }
}

const buildResourcesGroup = ({
  pluginConfig,
}: {
  pluginConfig: MCPPluginConfig
}): GroupField | null => {
  const checkboxes: Field[] = []
  for (const [key, resource] of Object.entries(pluginConfig.resources ?? {})) {
    checkboxes.push({
      name: key,
      type: 'checkbox',
      admin: { description: resource.description ?? `Allow clients to use ${key}.` },
      defaultValue: true,
      label: resource.title ?? key,
    })
  }
  if (checkboxes.length === 0) {
    return null
  }
  return {
    name: 'resources',
    type: 'group',
    admin: { description: 'Manage client access to resources' },
    fields: checkboxes,
    label: 'Resources',
  }
}
