import type { CollectionConfig } from 'payload'

import { collection1Slug, collection2Slug, relationUpdatedExternallySlug } from '../../slugs.js'

export const RelationshipUpdatedExternally: CollectionConfig = {
  fields: [
    {
      fields: [
        {
          name: 'relationPrePopulate',
          admin: {
            width: '75%',
          },
          relationTo: collection1Slug,
          type: 'relationship',
        },
        {
          name: 'prePopulate',
          admin: {
            components: {
              Field: {
                path: '/PrePopulateFieldUI/index.js#PrePopulateFieldUI',
                clientProps: {
                  hasMany: false,
                  hasMultipleRelations: false,
                  targetFieldPath: 'relationPrePopulate',
                },
              },
            },
            width: '25%',
          },
          type: 'ui',
        },
      ],
      type: 'row',
    },
    {
      fields: [
        {
          name: 'relationHasMany',
          admin: {
            width: '75%',
          },
          hasMany: true,
          relationTo: collection1Slug,
          type: 'relationship',
        },
        {
          name: 'prePopulateRelationHasMany',
          admin: {
            components: {
              Field: {
                path: '/PrePopulateFieldUI/index.js#PrePopulateFieldUI',
                clientProps: {
                  hasMultipleRelations: false,
                  targetFieldPath: 'relationHasMany',
                },
              },
            },
            width: '25%',
          },
          type: 'ui',
        },
      ],
      type: 'row',
    },
    {
      fields: [
        {
          name: 'relationToManyHasMany',
          admin: {
            width: '75%',
          },
          hasMany: true,
          relationTo: [collection1Slug, collection2Slug],
          type: 'relationship',
        },
        {
          name: 'prePopulateToMany',
          admin: {
            components: {
              Field: {
                path: '/PrePopulateFieldUI/index.js#PrePopulateFieldUI',
                clientProps: {
                  hasMultipleRelations: true,
                  targetFieldPath: 'relationToManyHasMany',
                },
              },
            },
            width: '25%',
          },
          type: 'ui',
        },
      ],
      type: 'row',
    },
  ],
  slug: relationUpdatedExternallySlug,
}
