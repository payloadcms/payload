import type { RelationshipField } from '../fields/config/types.js'
import type { CreateTaxonomyFieldOptions } from './types.js'

import { getTaxonomyFieldName } from './constants.js'

/**
 * Creates a relationship field that references a taxonomy collection.
 *
 * Use this in your collection's fields array to add a taxonomy relationship.
 * The field name is automatically generated based on the taxonomy slug.
 *
 * @example
 * import { createTaxonomyField } from 'payload'
 *
 * const Posts: CollectionConfig = {
 *   slug: 'posts',
 *   fields: [
 *     { name: 'title', type: 'text' },
 *     createTaxonomyField({
 *       taxonomySlug: 'tags',
 *       hasMany: true,
 *       label: 'Tags',
 *     }),
 *   ],
 * }
 */
export function createTaxonomyField(options: CreateTaxonomyFieldOptions): RelationshipField {
  const { admin: adminOverrides, taxonomySlug, ...restOptions } = options

  return {
    name: getTaxonomyFieldName(taxonomySlug),
    type: 'relationship',
    admin: {
      position: 'sidebar',
      ...adminOverrides,
    },
    hasMany: false,
    index: true,
    label: taxonomySlug,
    relationTo: taxonomySlug,
    ...restOptions,
  } as RelationshipField
}
