import type { RelationshipField } from '../fields/config/types.js'

export type BuildTaxonomyRelationshipFieldArgs = {
  /** Name for the relationship field */
  fieldName: string
  /** Whether documents can reference multiple taxonomy items */
  hasMany: boolean
  /** Optional label override */
  label?: string
  /** The taxonomy collection slug this field points to */
  taxonomySlug: string
}

export const buildTaxonomyRelationshipField = ({
  fieldName,
  hasMany,
  label,
  taxonomySlug,
}: BuildTaxonomyRelationshipFieldArgs): RelationshipField => {
  return {
    name: fieldName,
    type: 'relationship',
    admin: {
      position: 'sidebar',
    },
    hasMany,
    index: true,
    label: label || taxonomySlug,
    relationTo: taxonomySlug,
  } as RelationshipField
}
