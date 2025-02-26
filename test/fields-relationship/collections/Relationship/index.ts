import type { CollectionConfig, FilterOptionsProps } from 'payload'

import type { FieldsRelationship } from '../../payload-types.js'

import {
  relationFalseFilterOptionSlug,
  relationOneSlug,
  relationRestrictedSlug,
  relationTrueFilterOptionSlug,
  relationTwoSlug,
  relationWithTitleSlug,
  slug,
} from '../../slugs.js'

export const Relationship: CollectionConfig = {
  admin: {
    defaultColumns: [
      'id',
      'relationship',
      'relationshipRestricted',
      'relationshipHasManyMultiple',
      'relationshipWithTitle',
    ],
  },
  fields: [
    {
      name: 'relationship',
      relationTo: relationOneSlug,
      type: 'relationship',
    },
    {
      name: 'relationshipHasMany',
      hasMany: true,
      relationTo: relationOneSlug,
      type: 'relationship',
    },
    {
      name: 'relationshipMultiple',
      relationTo: [relationOneSlug, relationTwoSlug],
      type: 'relationship',
    },
    {
      name: 'relationshipHasManyMultiple',
      hasMany: true,
      relationTo: [relationOneSlug, relationTwoSlug],
      type: 'relationship',
    },
    {
      name: 'relationshipRestricted',
      relationTo: relationRestrictedSlug,
      type: 'relationship',
    },
    {
      name: 'relationshipWithTitle',
      relationTo: relationWithTitleSlug,
      type: 'relationship',
    },
    {
      name: 'relationshipFilteredByID',
      label: 'Relationship Filtered By ID',
      filterOptions: (args: FilterOptionsProps<FieldsRelationship>) => {
        return {
          id: {
            equals: args.data.relationship,
          },
        }
      },
      relationTo: relationOneSlug,
      type: 'relationship',
      admin: {
        description:
          'This will filter the relationship options based on id, which is the same as the relationship field in this document',
      },
    },
    {
      name: 'relationshipFilteredByField',
      filterOptions: () => {
        return {
          filter: {
            equals: 'Include me',
          },
        }
      },
      admin: {
        description:
          'This will filter the relationship options if the filter field in this document is set to "Include me"',
      },
      relationTo: slug,
      type: 'relationship',
    },
    {
      type: 'collapsible',
      label: 'Collapsible',
      fields: [
        {
          name: 'nestedRelationshipFilteredByField',
          filterOptions: () => {
            return {
              filter: {
                equals: 'Include me',
              },
            }
          },
          admin: {
            description:
              'This will filter the relationship options if the filter field in this document is set to "Include me"',
          },
          relationTo: slug,
          type: 'relationship',
        },
      ],
    },
    {
      name: 'relationshipFilteredAsync',
      filterOptions: (args: FilterOptionsProps<FieldsRelationship>) => {
        return {
          id: {
            equals: args.data.relationship,
          },
        }
      },
      relationTo: relationOneSlug,
      type: 'relationship',
    },
    {
      name: 'relationshipManyFiltered',
      filterOptions: ({ relationTo, siblingData }) => {
        if (relationTo === relationOneSlug) {
          return { name: { equals: 'include' } }
        }

        if (relationTo === relationTrueFilterOptionSlug) {
          return true
        }

        if (relationTo === relationFalseFilterOptionSlug) {
          return false
        }

        if (siblingData.filter) {
          return { name: { contains: siblingData.filter } }
        }

        return { and: [] }
      },
      hasMany: true,
      relationTo: [
        relationWithTitleSlug,
        relationFalseFilterOptionSlug,
        relationTrueFilterOptionSlug,
        relationOneSlug,
      ],
      type: 'relationship',
    },
    {
      name: 'filter',
      type: 'text',
    },
    {
      name: 'relationshipReadOnly',
      admin: {
        readOnly: true,
      },
      relationTo: relationOneSlug,
      type: 'relationship',
    },
  ],
  slug,
}
