import type { Field, GroupField } from 'payload'

import type { MCPItem, SanitizedMCPPluginConfig } from '../types.js'

import { toCamelCase } from '../utils/camelCase.js'

/**
 * Returns the API key collection's `access` field — a single top-level `group`
 * with nested groups matching the runtime access tree the endpoint consults.
 */
export const getAccessGroupField = ({
  pluginConfig,
}: {
  pluginConfig: SanitizedMCPPluginConfig
}): GroupField => {
  const collections: Record<string, MCPItem[]> = {}
  const globals: Record<string, MCPItem[]> = {}
  const tools: MCPItem[] = []
  const prompts: MCPItem[] = []
  const resources: MCPItem[] = []

  for (const item of pluginConfig.items) {
    switch (item.type) {
      case 'collectionTool':
        ;(collections[item.collectionSlug] ??= []).push(item)
        break
      case 'globalTool':
        ;(globals[item.globalSlug] ??= []).push(item)
        break
      case 'prompt':
        prompts.push(item)
        break
      case 'resource':
        resources.push(item)
        break
      case 'tool':
        tools.push(item)
        break
    }
  }

  const fields: Field[] = []
  const collectionsGroup = buildScopedGroup(collections, 'collections', 'Collections')
  if (collectionsGroup) {
    fields.push(collectionsGroup)
  }
  const globalsGroup = buildScopedGroup(globals, 'globals', 'Globals')
  if (globalsGroup) {
    fields.push(globalsGroup)
  }
  const toolsGroup = buildFlatGroup(tools, 'tools', 'Tools', 'Top-level (cross-cutting) tools')
  if (toolsGroup) {
    fields.push(toolsGroup)
  }
  const promptsGroup = buildFlatGroup(
    prompts,
    'prompts',
    'Prompts',
    'Manage client access to prompts',
  )
  if (promptsGroup) {
    fields.push(promptsGroup)
  }
  const resourcesGroup = buildFlatGroup(
    resources,
    'resources',
    'Resources',
    'Manage client access to resources',
  )
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

const toCheckbox = (item: MCPItem): Field => {
  const description =
    item.type === 'prompt'
      ? item.prompt.description
      : item.type === 'resource'
        ? item.resource.description
        : item.tool.description
  return {
    name: item.key,
    type: 'checkbox',
    admin: { description },
    defaultValue: true,
    label: item.label,
  }
}

const buildScopedGroup = (
  scope: Record<string, MCPItem[]>,
  name: 'collections' | 'globals',
  label: string,
): GroupField | null => {
  const slugFields: Field[] = []
  for (const [slug, slugItems] of Object.entries(scope)) {
    if (slugItems.length === 0) {
      continue
    }
    const camel = toCamelCase(slug)
    slugFields.push({
      name: camel,
      type: 'group',
      fields: slugItems.map(toCheckbox),
      label: camel.charAt(0).toUpperCase() + camel.slice(1),
    })
  }
  if (slugFields.length === 0) {
    return null
  }
  return { name, type: 'group', fields: slugFields, label }
}

const buildFlatGroup = (
  items: MCPItem[],
  name: 'prompts' | 'resources' | 'tools',
  label: string,
  description: string,
): GroupField | null => {
  if (items.length === 0) {
    return null
  }
  return {
    name,
    type: 'group',
    admin: { description },
    fields: items.map(toCheckbox),
    label,
  }
}
