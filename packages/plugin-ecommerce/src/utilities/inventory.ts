import type { InventoryConfig } from '../types/index.js'

/**
 * The field name used to track inventory levels when the plugin config does not override it.
 */
export const defaultInventoryFieldName = 'inventory'

/**
 * Resolves the name of the field used to track inventory levels.
 *
 * Accepts the plugin's `inventory` option and falls back to
 * {@link defaultInventoryFieldName} when no override is configured.
 */
export const getInventoryFieldName = (inventory?: boolean | InventoryConfig): string => {
  if (typeof inventory === 'object' && inventory.fieldName) {
    return inventory.fieldName
  }

  return defaultInventoryFieldName
}
