import type { Field } from 'payload'

import type { CollectionOrGlobalConfig } from '../types.js'

import { adminOperationSettings } from './adminOperationSettings.js'
import { toCamelCase } from './camelCase.js'
import { getEnabledSlugs } from './getEnabledSlugs.js'
/**
 * Creates MCP API key permission fields using collections or globals.
 * Generates collapsible field groups with checkboxes for each enabled operation.
 *
 * @param config - The collections or globals configuration object
 * @param configType - The type of configuration ('collection' or 'global')
 * @returns Array of fields for the MCP API Keys collection
 */
export const createApiKeyFields = ({
  config,
  configType,
}: {
  config: CollectionOrGlobalConfig | undefined
  configType: 'collection' | 'global'
}): Field[] => {
  const operations = adminOperationSettings[configType]

  const operationNames = operations.map((op) => op.name)
  const enabledSlugs = getEnabledSlugs(config, operationNames)

  return enabledSlugs.map((slug) => {
    const entityConfig = config?.[slug]

    const enabledOperations = operations.filter((operation) => {
      // If fully enabled, all operations are available
      if (entityConfig?.enabled === true) {
        return true
      }

      // If partially enabled, check if this specific operation is enabled
      const enabled = entityConfig?.enabled
      if (typeof enabled !== 'boolean' && enabled) {
        const operationEnabled = enabled[operation.name as keyof typeof enabled]
        return typeof operationEnabled === 'boolean' && operationEnabled === true
      }

      return false
    })

    // Generate checkbox fields for each enabled operation
    const operationFields = enabledOperations.map((operation) => ({
      name: operation.name,
      type: 'checkbox' as const,
      admin: {
        description: operation.description(slug),
      },
      defaultValue: false,
      label: operation.label,
    }))

    return {
      type: 'collapsible' as const,
      admin: {
        position: 'sidebar' as const,
      },
      fields: [
        {
          name: toCamelCase(slug),
          type: 'group' as const,
          fields: operationFields,
          label: configType,
        },
      ],
      label: `${slug.charAt(0).toUpperCase() + toCamelCase(slug).slice(1)}`,
    }
  })
}
