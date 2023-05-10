import type { CollectionConfig } from '../../src/collections/config/types';
import { buildConfig } from '../buildConfig';
import { devUser } from '../credentials';
import { mapAsync } from '../../src/utilities/mapAsync';
import { FilterOptionsProps } from '../../src/fields/config/types';
import { PrePopulateFieldUI } from './PrePopulateFieldUI';
import { relationOneSlug, relationTwoSlug, relationRestrictedSlug, relationWithTitleSlug, relationUpdatedExternallySlug, collection1Slug, collection2Slug, slug } from './collectionSlugs';

export interface FieldsRelationship {
  id: string;
  relationship: RelationOne;
  relationshipHasMany: RelationOne[];
  relationshipHasManyMultiple: Array<RelationOne | RelationTwo | { relationTo: string; value: string }>;
  relationshipMultiple: Array<RelationOne | RelationTwo>;
  relationshipRestricted: RelationRestricted;
  relationshipWithTitle: RelationWithTitle;
  createdAt: Date;
  updatedAt: Date;
}

export interface RelationOne {
  id: string;
  name: string;
}
export type RelationTwo = RelationOne;
export type RelationRestricted = RelationOne;
export type RelationWithTitle = RelationOne;

const baseRelationshipFields: CollectionConfig['fields'] = [
  {
    name: 'name',
    type: 'text',
  },
];

export default buildConfig({
  collections: [
    {
      slug,
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
          type: 'relationship',
          name: 'relationship',
          relationTo: relationOneSlug,
        },
        {
          type: 'relationship',
          name: 'relationshipHasMany',
          relationTo: relationOneSlug,
          hasMany: true,
        },
        {
          type: 'relationship',
          name: 'relationshipMultiple',
          relationTo: [relationOneSlug, relationTwoSlug],
        },
        {
          type: 'relationship',
          name: 'relationshipHasManyMultiple',
          hasMany: true,
          relationTo: [relationOneSlug, relationTwoSlug],
        },
        {
          type: 'relationship',
          name: 'relationshipRestricted',
          relationTo: relationRestrictedSlug,
        },
        {
          type: 'relationship',
          name: 'relationshipWithTitle',
          relationTo: relationWithTitleSlug,
        },
        {
          type: 'relationship',
          name: 'relationshipFiltered',
          relationTo: relationOneSlug,
          filterOptions: (args: FilterOptionsProps<FieldsRelationship>) => {
            return ({
              id: {
                equals: args.data.relationship,
              },
            });
          },
        },
        {
          type: 'relationship',
          name: 'relationshipManyFiltered',
          relationTo: [relationWithTitleSlug, relationOneSlug],
          hasMany: true,
          filterOptions: ({ relationTo, siblingData }: any) => {
            if (relationTo === relationOneSlug) {
              return { name: { equals: 'include' } };
            }
            if (siblingData.filter) {
              return { name: { contains: siblingData.filter } };
            }
            return { and: [] };
          },
        },
        {
          type: 'text',
          name: 'filter',
        },
        {
          name: 'relationshipReadOnly',
          type: 'relationship',
          relationTo: relationOneSlug,
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      slug: relationOneSlug,
      fields: baseRelationshipFields,
    },
    {
      slug: relationTwoSlug,
      fields: baseRelationshipFields,
    },
    {
      slug: relationRestrictedSlug,
      admin: {
        useAsTitle: 'name',
      },
      fields: baseRelationshipFields,
      access: {
        read: () => false,
        create: () => false,
      },
    },
    {
      slug: relationWithTitleSlug,
      admin: {
        useAsTitle: 'meta.title',
      },
      fields: [
        ...baseRelationshipFields,
        {
          name: 'meta',
          type: 'group',
          fields: [
            {
              name: 'title',
              label: 'Meta Title',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      slug: relationUpdatedExternallySlug,
      admin: {
        useAsTitle: 'name',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'relationPrePopulate',
              type: 'relationship',
              relationTo: collection1Slug,
              admin: {
                width: '75%',
              },
            },
            {
              type: 'ui',
              name: 'prePopulate',
              admin: {
                width: '25%',
                components: {
                  Field: () => PrePopulateFieldUI({ path: 'relationPrePopulate', hasMany: false }),
                },
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'relationHasMany',
              type: 'relationship',
              relationTo: collection1Slug,
              hasMany: true,
              admin: {
                width: '75%',
              },
            },
            {
              type: 'ui',
              name: 'prePopulateRelationHasMany',
              admin: {
                width: '25%',
                components: {
                  Field: () => PrePopulateFieldUI({ path: 'relationHasMany', hasMultipleRelations: false }),
                },
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'relationToManyHasMany',
              type: 'relationship',
              relationTo: [collection1Slug, collection2Slug],
              hasMany: true,
              admin: {
                width: '75%',
              },
            },
            {
              type: 'ui',
              name: 'prePopulateToMany',
              admin: {
                width: '25%',
                components: {
                  Field: () => PrePopulateFieldUI({ path: 'relationToManyHasMany', hasMultipleRelations: true }),
                },
              },
            },
          ],
        },
      ],
    },
    {
      slug: collection1Slug,
      fields: [
        {
          type: 'text',
          name: 'name',
        },
      ],
    },
    {
      slug: collection2Slug,
      fields: [
        {
          type: 'text',
          name: 'name',
        },
      ],
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    });
    // Create docs to relate to
    const { id: relationOneDocId } = await payload.create({
      collection: relationOneSlug,
      data: {
        name: relationOneSlug,
      },
    });

    const relationOneIDs: string[] = [];
    await mapAsync([...Array(11)], async () => {
      const doc = await payload.create({
        collection: relationOneSlug,
        data: {
          name: relationOneSlug,
        },
      });
      relationOneIDs.push(doc.id);
    });

    const relationTwoIDs: string[] = [];
    await mapAsync([...Array(11)], async () => {
      const doc = await payload.create({
        collection: relationTwoSlug,
        data: {
          name: relationTwoSlug,
        },
      });
      relationTwoIDs.push(doc.id);
    });

    // Existing relationships
    const { id: restrictedDocId } = await payload.create({
      collection: relationRestrictedSlug,
      data: {
        name: 'relation-restricted',
      },
    });

    const relationsWithTitle: string[] = [];

    await mapAsync(['relation-title', 'word boundary search'], async (title) => {
      const { id } = await payload.create({
        collection: relationWithTitleSlug,
        data: {
          name: title,
          meta: {
            title,
          },
        },
      });
      relationsWithTitle.push(id);
    });

    await payload.create({
      collection: slug,
      data: {
        relationship: relationOneDocId,
        relationshipRestricted: restrictedDocId,
        relationshipWithTitle: relationsWithTitle[0],
      },
    });
    await mapAsync([...Array(11)], async () => {
      await payload.create({
        collection: slug,
        data: {
          relationship: relationOneDocId,
          relationshipRestricted: restrictedDocId,
          relationshipHasManyMultiple: relationOneIDs.map((id) => ({
            relationTo: relationOneSlug,
            value: id,
          })),
        },
      });
    });

    await mapAsync([...Array(15)], async () => {
      const relationOneID = relationOneIDs[Math.floor(Math.random() * 10)];
      const relationTwoID = relationTwoIDs[Math.floor(Math.random() * 10)];
      await payload.create({
        collection: slug,
        data: {
          relationship: relationOneDocId,
          relationshipRestricted: restrictedDocId,
          relationshipHasMany: [relationOneID],
          relationshipHasManyMultiple: [{ relationTo: relationTwoSlug, value: relationTwoID }],
          relationshipReadOnly: relationOneID,
        },
      });
    });

    [...Array(15)].forEach((_, i) => {
      payload.create({
        collection: collection1Slug,
        data: {
          name: `relationship-test ${i}`,
        },
      });
      payload.create({
        collection: collection2Slug,
        data: {
          name: `relationship-test ${i}`,
        },
      });
    });
  },
});
