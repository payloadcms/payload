import type { PluginMCPServerConfig } from '../types.js'

type EntityConfig = PluginMCPServerConfig['collections'] | PluginMCPServerConfig['globals']

/**
 * Extracts enabled slugs from collections or globals configuration.
 * A slug is considered enabled if:
 * 1. enabled is set to true (fully enabled)
 * 2. enabled is an object with at least one operation set to true
 *
 * @param config - The collections or globals configuration object
 * @param operations - List of valid operations to check (e.g., ['find', 'create', 'update', 'delete'])
 * @returns Array of enabled slugs
 */
export const getEnabledSlugs = (
  config: EntityConfig,
  operations: string[] = ['find', 'create', 'update', 'delete'],
): string[] => {
  return Object.keys(config || {}).filter((slug) => {
    const entityConfig = config?.[slug]

    // Check if fully enabled (boolean true)
    const fullyEnabled =
      typeof entityConfig?.enabled === 'boolean' && entityConfig?.enabled === true

    if (fullyEnabled) {
      return true
    }

    // Check if partially enabled (at least one operation is enabled)
    const partiallyEnabled =
      typeof entityConfig?.enabled !== 'boolean' &&
      operations.some(
        (operation) =>
          typeof entityConfig?.enabled?.[operation] === 'boolean' &&
          entityConfig?.enabled?.[operation] === true,
      )

    return partiallyEnabled
  })
}
