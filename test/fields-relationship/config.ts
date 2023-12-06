import type { CollectionConfig } from '../../packages/payload/src/collections/config/types'
import type { FilterOptionsProps } from '../../packages/payload/src/fields/config/types'

import { mapAsync } from '../../packages/payload/src/utilities/mapAsync'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { PrePopulateFieldUI } from './PrePopulateFieldUI'
import {
  collection1Slug,
  collection2Slug,
  relationFalseFilterOptionSlug,
  relationOneSlug,
  relationRestrictedSlug,
  relationTrueFilterOptionSlug,
  relationTwoSlug,
  relationUpdatedExternallySlug,
  relationWithTitleSlug,
  slug,
} from './collectionSlugs'

export interface FieldsRelationship {
  createdAt: Date
  id: string
  relationship: RelationOne
  relationshipHasMany: RelationOne[]
  relationshipHasManyMultiple: Array<{ relationTo: string; value: string } | RelationOne>
  relationshipMultiple: Array<RelationOne>
  relationshipRestricted: RelationRestricted
  relationshipWithTitle: RelationWithTitle
  updatedAt: Date
}

export interface RelationOne {
  id: string
  name: string
}

export type RelationTwo = RelationOne
export type RelationRestricted = RelationOne
export type RelationWithTitle = RelationOne

const baseRelationshipFields: CollectionConfig['fields'] = [
  {
    name: 'name',
    type: 'text',
  },
]

export default buildConfigWithDefaults({
  collections: [
    {
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
          name: 'relationshipFiltered',
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
          name: 'relationshipFilteredAsync',
          filterOptions: async (args: FilterOptionsProps<FieldsRelationship>) => {
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
          filterOptions: ({ relationTo, siblingData }: any) => {
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
    },
    {
      admin: {
        useAsTitle: 'name',
      },
      fields: baseRelationshipFields,
      slug: relationFalseFilterOptionSlug,
    },
    {
      admin: {
        useAsTitle: 'name',
      },
      fields: baseRelationshipFields,
      slug: relationTrueFilterOptionSlug,
    },
    {
      fields: baseRelationshipFields,
      slug: relationOneSlug,
    },
    {
      fields: baseRelationshipFields,
      slug: relationTwoSlug,
    },
    {
      access: {
        create: () => false,
        read: () => false,
      },
      admin: {
        useAsTitle: 'name',
      },
      fields: baseRelationshipFields,
      slug: relationRestrictedSlug,
    },
    {
      admin: {
        useAsTitle: 'meta.title',
      },
      fields: [
        ...baseRelationshipFields,
        {
          name: 'meta',
          fields: [
            {
              name: 'title',
              label: 'Meta Title',
              type: 'text',
            },
          ],
          type: 'group',
        },
      ],
      slug: relationWithTitleSlug,
    },
    {
      admin: {
        useAsTitle: 'name',
      },
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
                  Field: () => PrePopulateFieldUI({ hasMany: false, path: 'relationPrePopulate' }),
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
                  Field: () =>
                    PrePopulateFieldUI({ hasMultipleRelations: false, path: 'relationHasMany' }),
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
                  Field: () =>
                    PrePopulateFieldUI({
                      hasMultipleRelations: true,
                      path: 'relationToManyHasMany',
                    }),
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
    },
    {
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      slug: collection1Slug,
    },
    {
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      slug: collection2Slug,
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
    // Create docs to relate to
    const { id: relationOneDocId } = await payload.create({
      collection: relationOneSlug,
      data: {
        name: relationOneSlug,
      },
    })

    const relationOneIDs: string[] = []
    await mapAsync([...Array(11)], async () => {
      const doc = await payload.create({
        collection: relationOneSlug,
        data: {
          name: relationOneSlug,
        },
      })
      relationOneIDs.push(doc.id)
    })

    const relationTwoIDs: string[] = []
    await mapAsync([...Array(11)], async () => {
      const doc = await payload.create({
        collection: relationTwoSlug,
        data: {
          name: relationTwoSlug,
        },
      })
      relationTwoIDs.push(doc.id)
    })

    // Existing relationships
    const { id: restrictedDocId } = await payload.create({
      collection: relationRestrictedSlug,
      data: {
        name: 'relation-restricted',
      },
    })

    const relationsWithTitle: string[] = []

    await mapAsync(['relation-title', 'word boundary search'], async (title) => {
      const { id } = await payload.create({
        collection: relationWithTitleSlug,
        data: {
          name: title,
          meta: {
            title,
          },
        },
      })
      relationsWithTitle.push(id)
    })

    await payload.create({
      collection: slug,
      data: {
        relationship: relationOneDocId,
        relationshipRestricted: restrictedDocId,
        relationshipWithTitle: relationsWithTitle[0],
      },
    })
    await mapAsync([...Array(11)], async () => {
      await payload.create({
        collection: slug,
        data: {
          relationship: relationOneDocId,
          relationshipHasManyMultiple: relationOneIDs.map((id) => ({
            relationTo: relationOneSlug,
            value: id,
          })),
          relationshipRestricted: restrictedDocId,
        },
      })
    })

    await mapAsync([...Array(15)], async () => {
      const relationOneID = relationOneIDs[Math.floor(Math.random() * 10)]
      const relationTwoID = relationTwoIDs[Math.floor(Math.random() * 10)]
      await payload.create({
        collection: slug,
        data: {
          relationship: relationOneDocId,
          relationshipHasMany: [relationOneID],
          relationshipHasManyMultiple: [{ relationTo: relationTwoSlug, value: relationTwoID }],
          relationshipReadOnly: relationOneID,
          relationshipRestricted: restrictedDocId,
        },
      })
    })
    ;[...Array(15)].forEach((_, i) => {
      payload.create({
        collection: collection1Slug,
        data: {
          name: `relationship-test ${i}`,
        },
      })
      payload.create({
        collection: collection2Slug,
        data: {
          name: `relationship-test ${i}`,
        },
      })
    })
  },
})
