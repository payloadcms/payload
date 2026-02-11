import type { CollectionConfig } from '../collections/config/types.js'
import type { TaxonomyConfig } from './types.js'

/**
 * Options for creating a taxonomy collection.
 * Same as CollectionConfig but with `taxonomy` required.
 */
export type CreateTaxonomyCollectionOptions = {
  /**
   * Taxonomy configuration (required)
   */
  taxonomy: TaxonomyConfig
} & Omit<CollectionConfig, 'taxonomy'>

/**
 * Creates a collection config for a taxonomy collection.
 *
 * This helper provides:
 * - Required `taxonomy` property with proper typing
 * - `admin.group: false` by default to hide from collections list
 *   (taxonomy collections are accessed via their dedicated sidebar tab)
 *
 * @example
 * import { createTaxonomyCollection, createTaxonomyField } from 'payload'
 *
 * const Tags = createTaxonomyCollection({
 *   slug: 'tags',
 *   taxonomy: {
 *     relatedCollections: ['posts', 'pages'],
 *   },
 *   fields: [
 *     { name: 'name', type: 'text', required: true },
 *   ],
 * })
 *
 * // Then in related collections:
 * const Posts: CollectionConfig = {
 *   slug: 'posts',
 *   fields: [
 *     createTaxonomyField({ taxonomySlug: 'tags', hasMany: true }),
 *   ],
 * }
 */
export function createTaxonomyCollection(
  options: CreateTaxonomyCollectionOptions,
): CollectionConfig {
  const { admin: adminOverrides, ...rest } = options

  return {
    ...rest,
    admin: {
      group: false,
      ...(adminOverrides || {}),
    },
  }
}
