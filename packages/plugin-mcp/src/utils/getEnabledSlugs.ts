import type { CollectionOrGlobalConfig } from '../types.js'

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
  config: CollectionOrGlobalConfig | undefined,
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
    const enabled = entityConfig?.enabled
    if (typeof enabled !== 'boolean' && enabled) {
      return operations.some((operation) => {
        const operationEnabled = enabled[operation as keyof typeof enabled]
        return typeof operationEnabled === 'boolean' && operationEnabled === true
      })
    }

    return false
  })
}
