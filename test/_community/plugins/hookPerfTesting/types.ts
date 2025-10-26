import type { CollectionSlug } from 'payload'

export type HookPerfTestingConfig = {
  /**
   * Array of collection slugs to inject performance testing hooks into.
   * If not provided, will instrument all collections.
   */
  collections?: CollectionSlug[]
  /**
   * Enable/disable the plugin
   */
  enabled?: boolean
}
