import type { CollectionConfig, Field } from 'payload'

import type { MCPPluginConfig } from '../types.js'

import { adminEntitySettings } from '../utils/adminEntitySettings.js'
import { toCamelCase } from '../utils/camelCase.js'
import {
  getActiveCollectionSlugs,
  getActiveGlobalSlugs,
  isOperationDisabled,
} from '../utils/disabledHelpers.js'

/**
 * Creates MCP API key permission fields. One collapsible group per active
 * collection / global, with a checkbox for each operation that isn't disabled in
 * the plugin config. All checkboxes default to `true` (opt-out) — admins
 * uncheck to restrict a specific key.
 */
export const createApiKeyFields = ({
  configType,
  payloadEntities,
  pluginConfig,
}: {
  configType: 'collection' | 'global'
  payloadEntities: { slug: string }[] | undefined
  pluginConfig: MCPPluginConfig
}): Field[] => {
  const operations = adminEntitySettings[configType]
  const activeSlugs =
    configType === 'collection'
      ? getActiveCollectionSlugs(
          payloadEntities as CollectionConfig[] | undefined,
          pluginConfig.collections,
        )
      : getActiveGlobalSlugs(payloadEntities, pluginConfig.globals)

  return activeSlugs.map((slug) => {
    const allowedOperations = operations.filter(
      (operation) =>
        !isOperationDisabled(
          configType === 'collection' ? pluginConfig.collections : pluginConfig.globals,
          slug,
          operation.name,
        ),
    )

    const operationFields: Field[] = allowedOperations.map((operation) => ({
      name: operation.name,
      type: 'checkbox',
      admin: {
        description: operation.description(slug),
      },
      defaultValue: true,
      label: operation.label,
    }))

    return {
      type: 'collapsible',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: toCamelCase(slug),
          type: 'group',
          fields: operationFields,
          label: configType,
        },
      ],
      label: `${slug.charAt(0).toUpperCase() + toCamelCase(slug).slice(1)}`,
    }
  })
}
