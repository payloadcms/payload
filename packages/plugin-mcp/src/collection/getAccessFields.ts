import type { CollapsibleField, Config, SanitizedConfig } from 'payload'

import type { MCPPluginConfig } from '../types.js'

import { toCamelCase } from '../utils/camelCase.js'
import {
  getEnabledCollectionSlugs,
  getEnabledGlobalSlugs,
  isOperationDisabled,
} from '../utils/disabledHelpers.js'

const collectionOperations = ['find', 'create', 'update', 'delete'] as const
const globalOperations = ['find', 'update'] as const

/**
 * Returns MCP API key permission fields. One collapsible group per active
 * collection / global, with a checkbox for each operation that isn't disabled in
 * the plugin config. All checkboxes default to `true` (opt-out) — admins
 * uncheck to restrict a specific key.
 */
export const getAccessFields = ({
  config,
  entityType,
  pluginConfig,
}: {
  config: Config | SanitizedConfig
  entityType: 'collection' | 'global'
  pluginConfig: MCPPluginConfig
}): CollapsibleField[] => {
  const enabledSlugs =
    entityType === 'collection'
      ? getEnabledCollectionSlugs(config.collections, pluginConfig.collections)
      : getEnabledGlobalSlugs(config.globals, pluginConfig.globals)

  const fields: CollapsibleField[] = []

  for (const slug of enabledSlugs) {
    const enabledOperations =
      entityType === 'collection'
        ? collectionOperations.filter(
            (operation) => !isOperationDisabled(pluginConfig.collections, slug, operation),
          )
        : globalOperations.filter(
            (operation) => !isOperationDisabled(pluginConfig.globals, slug, operation),
          )

    fields.push({
      type: 'collapsible',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: toCamelCase(slug),
          type: 'group',
          fields: enabledOperations.map((operation) => ({
            name: operation,
            type: 'checkbox',
            admin: {
              description:
                entityType === 'collection'
                  ? `Allow clients to ${operation} ${slug}.`
                  : `Allow clients to ${operation} ${slug} global.`,
            },
            defaultValue: true,
            label: operation.charAt(0).toUpperCase() + operation.slice(1),
          })),
          label: entityType,
        },
      ],
      label: `${slug.charAt(0).toUpperCase() + toCamelCase(slug).slice(1)}`,
    })
  }

  return fields
}
