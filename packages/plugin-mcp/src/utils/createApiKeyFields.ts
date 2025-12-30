import type { Field } from 'payload'

import type { PluginMCPServerConfig } from '../types.js'

import { toCamelCase } from './camelCase.js'
import { getEnabledSlugs } from './getEnabledSlugs.js'

type EntityConfig = PluginMCPServerConfig['collections'] | PluginMCPServerConfig['globals']

type Operation = {
  description: (slug: string, entityType: string) => string
  label: string
  name: string
}

/**
 * Creates API key permission fields for collections or globals.
 * Generates collapsible field groups with checkboxes for each enabled operation.
 *
 * @param config - The collections or globals configuration object
 * @param entityType - Type of entity ('collection' or 'global')
 * @param operations - Array of operations to create checkboxes for
 * @returns Array of Payload fields for the API Keys collection
 */
export const createApiKeyFields = (
  config: EntityConfig,
  entityType: 'collection' | 'global',
  operations: Operation[],
): Field[] => {
  const operationNames = operations.map((op) => op.name)
  const enabledSlugs = getEnabledSlugs(config, operationNames)

  return enabledSlugs.map((slug) => {
    const entityConfig = config?.[slug]

    // Determine which operations are enabled for this entity
    const enabledOperations = operations.filter((operation) => {
      // If fully enabled, all operations are available
      if (entityConfig?.enabled === true) {
        return true
      }

      // If partially enabled, check if this specific operation is enabled
      return (
        typeof entityConfig?.enabled !== 'boolean' &&
        typeof entityConfig?.enabled?.[operation.name] === 'boolean' &&
        entityConfig?.enabled?.[operation.name] === true
      )
    })

    // Generate checkbox fields for each enabled operation
    const operationFields = enabledOperations.map((operation) => ({
      name: operation.name,
      type: 'checkbox' as const,
      admin: {
        description: operation.description(slug, entityType),
      },
      defaultValue: false,
      label: operation.label,
    }))

    // Return collapsible field group
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
        },
      ],
      label: `${slug.charAt(0).toUpperCase() + toCamelCase(slug).slice(1)} (${entityType === 'collection' ? 'Collection' : 'Global'})`,
    }
  })
}
