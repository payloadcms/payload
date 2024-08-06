import type { CollectionConfig } from '../../packages/payload/src/collections/config/types'
import type { FilterOptionsProps } from '../../packages/payload/src/fields/config/types'

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
import { VersionedRelationshipFieldCollection } from './collections/VersionedRelationshipField'

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
      admin: {
        useAsTitle: 'name',
      },
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
    VersionedRelationshipFieldCollection,
  ],
  localization: {
    locales: ['en'],
    defaultLocale: 'en',
    fallback: true,
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
      depth: 0,
      overrideAccess: true,
    })
    // Create docs to relate to
    const { id: relationOneDocId } = await payload.create({
      collection: relationOneSlug,
      data: {
        name: relationOneSlug,
      },
      depth: 0,
      overrideAccess: true,
    })

    const relationOneIDs: string[] = []
    for (let i = 0; i < 11; i++) {
      const doc = await payload.create({
        collection: relationOneSlug,
        data: {
          name: relationOneSlug,
        },
        depth: 0,
        overrideAccess: true,
      })
      relationOneIDs.push(doc.id)
    }

    const relationTwoIDs: string[] = []
    for (let i = 0; i < 11; i++) {
      const doc = await payload.create({
        collection: relationTwoSlug,
        data: {
          name: relationTwoSlug,
        },
        depth: 0,
        overrideAccess: true,
      })
      relationTwoIDs.push(doc.id)
    }

    // Existing relationships
    const { id: restrictedDocId } = await payload.create({
      collection: relationRestrictedSlug,
      data: {
        name: 'relation-restricted',
      },
      depth: 0,
      overrideAccess: true,
    })

    const relationsWithTitle: string[] = []

    for (const title of ['relation-title', 'word boundary search']) {
      const { id } = await payload.create({
        collection: relationWithTitleSlug,
        depth: 0,
        overrideAccess: true,
        data: {
          name: title,
          meta: {
            title,
          },
        },
      })
      relationsWithTitle.push(id)
    }

    await payload.create({
      collection: slug,
      depth: 0,
      overrideAccess: true,
      data: {
        relationship: relationOneDocId,
        relationshipRestricted: restrictedDocId,
        relationshipWithTitle: relationsWithTitle[0],
      },
    })

    for (let i = 0; i < 11; i++) {
      await payload.create({
        collection: slug,
        depth: 0,
        overrideAccess: true,
        data: {
          relationship: relationOneDocId,
          relationshipHasManyMultiple: relationOneIDs.map((id) => ({
            relationTo: relationOneSlug,
            value: id,
          })),
          relationshipRestricted: restrictedDocId,
        },
      })
    }

    for (let i = 0; i < 15; i++) {
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
    }

    for (let i = 0; i < 15; i++) {
      await payload.create({
        collection: collection1Slug,
        depth: 0,
        overrideAccess: true,
        data: {
          name: `relationship-test ${i}`,
        },
      })
      await payload.create({
        collection: collection2Slug,
        depth: 0,
        overrideAccess: true,
        data: {
          name: `relationship-test ${i}`,
        },
      })
    }
  },
})
