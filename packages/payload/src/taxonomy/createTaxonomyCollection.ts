import type { CollectionConfig } from '../collections/config/types.js'
import type { TaxonomyConfig } from './types.js'

/**
 * Options for creating a taxonomy collection.
 * Same as CollectionConfig but with `taxonomy` and `useAsTitle` required.
 */
export type CreateTaxonomyCollectionOptions = {
  /**
   * Taxonomy configuration (required)
   */
  taxonomy: TaxonomyConfig
  /**
   * Field name to use as the display title in the taxonomy tree.
   * Required to ensure taxonomy items display meaningful names.
   */
  useAsTitle: string
} & Omit<CollectionConfig, 'admin' | 'taxonomy'> &
  Partial<Pick<CollectionConfig, 'admin'>>

/**
 * Creates a collection config for a taxonomy collection.
 *
 * This helper provides:
 * - Required `taxonomy` property with proper typing
 * - Required `useAsTitle` to ensure taxonomy items display meaningful names
 * - `admin.group: false` by default to hide from collections list
 *   (taxonomy collections are accessed via their dedicated sidebar tab)
 *
 * @example
 * import { createTaxonomyCollection, createTaxonomyField } from 'payload'
 *
 * const Tags = createTaxonomyCollection({
 *   slug: 'tags',
 *   useAsTitle: 'name',
 *   taxonomy: {},
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
  const { admin: adminOverrides, useAsTitle, ...rest } = options

  return {
    ...rest,
    admin: {
      group: false,
      ...adminOverrides,
      useAsTitle,
    },
  }
}
