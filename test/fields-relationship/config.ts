import type { CollectionConfig } from '../../src/collections/config/types';
import { buildConfig } from '../buildConfig';
import { devUser } from '../credentials';
import { mapAsync } from '../../src/utilities/mapAsync';

export const slug = 'fields-relationship';

export const relationOneSlug = 'relation-one';
export const relationTwoSlug = 'relation-two';
export const relationRestrictedSlug = 'relation-restricted';
export const relationWithTitleSlug = 'relation-with-title';
export const cascadingSlug = 'cascading';
export const cascadingHasManySlug = 'cascading-has-many';
export const cascadingPolySlug = 'cascading-poly';
export const cascadingHasManyPolySlug = 'cascading-has-many-poly';
export const cascadingNested = 'cascading-nested';

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
      ],
    },
    {
      slug: cascadingSlug,
      fields: [
        {
          type: 'relationship',
          name: 'relation',
          relationTo: relationOneSlug,
          cascade: true,
        },
      ],
    },
    {
      slug: cascadingHasManySlug,
      fields: [
        {
          type: 'relationship',
          name: 'relation',
          hasMany: true,
          relationTo: relationOneSlug,
          cascade: true,
        },
      ],
    },
    {
      slug: cascadingPolySlug,
      fields: [
        {
          type: 'relationship',
          name: 'relation',
          relationTo: [relationOneSlug, relationTwoSlug],
          cascade: true,
        },
      ],
    },
    {
      slug: cascadingHasManyPolySlug,
      fields: [
        {
          type: 'relationship',
          name: 'relation',
          hasMany: true,
          relationTo: [relationOneSlug, relationTwoSlug],
          cascade: true,
        },
      ],
    },
    {
      slug: cascadingNested,
      fields: [
        {
          type: 'group',
          name: 'group',
          fields: [
            {
              type: 'relationship',
              name: 'relation',
              relationTo: relationOneSlug,
              cascade: true,
            }],
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
      },
    },
    {
      slug: relationWithTitleSlug,
      admin: {
        useAsTitle: 'name',
      },
      fields: baseRelationshipFields,
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
    const { id: relationOneDocId } = await payload.create<RelationOne>({
      collection: relationOneSlug,
      data: {
        name: relationOneSlug,
      },
    });

    const relationOneIDs = [];
    await mapAsync([...Array(11)], async () => {
      const doc = await payload.create<RelationOne>({
        collection: relationOneSlug,
        data: {
          name: relationOneSlug,
        },
      });
      relationOneIDs.push(doc.id);
    });

    const relationTwoIDs = [];
    await mapAsync([...Array(11)], async () => {
      const doc = await payload.create<RelationTwo>({
        collection: relationTwoSlug,
        data: {
          name: relationTwoSlug,
        },
      });
      relationTwoIDs.push(doc.id);
    });

    // Existing relationships
    const { id: restrictedDocId } = await payload.create<RelationRestricted>({
      collection: relationRestrictedSlug,
      data: {
        name: 'relation-restricted',
      },
    });
    const relationsWithTitle = [];
    await mapAsync(['relation-title', 'word boundary search'], async (title) => {
      const { id } = await payload.create<RelationWithTitle>({
        collection: relationWithTitleSlug,
        data: {
          name: title,
        },
      });
      relationsWithTitle.push(id);
    });
    await payload.create<FieldsRelationship>({
      collection: slug,
      data: {
        relationship: relationOneDocId,
        relationshipRestricted: restrictedDocId,
        relationshipWithTitle: relationsWithTitle[0],
      },
    });
    await mapAsync([...Array(11)], async () => {
      await payload.create<FieldsRelationship>({
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
      await payload.create<FieldsRelationship>({
        collection: slug,
        data: {
          relationship: relationOneDocId,
          relationshipRestricted: restrictedDocId,
          relationshipHasMany: [relationOneID],
          relationshipHasManyMultiple: [{ relationTo: relationTwoSlug, value: relationTwoID }],
        },
      });
    });

    // cascading hooks
    await payload.create({
      collection: cascadingSlug,
      data: {
        relation: relationOneIDs[1],
      },
    });
    await payload.create({
      collection: cascadingHasManySlug,
      data: {
        relation: [relationOneIDs[2], relationOneIDs[3]],
      },
    });
    await payload.create({
      collection: cascadingPolySlug,
      data: {
        relation: { value: relationTwoIDs[2], relationTo: relationTwoSlug },
      },
    });
    await payload.create({
      collection: cascadingHasManyPolySlug,
      data: {
        relation: [{
          value: relationOneIDs[4], relationTo: relationOneSlug,
        }, {
          value: relationTwoIDs[5],
          relationTo: relationTwoSlug,
        }],
      },
    });
  },
});
