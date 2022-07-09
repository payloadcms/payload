import { CollectionConfig } from '../../../src/collections/config/types';
import { buildConfig } from '../buildConfig';

export const slug = 'fields-relationship';

export const relationOneSlug = 'relation-one';
export const relationTwoSlug = 'relation-two';
export const relationRestrictedSlug = 'relation-restricted';

export interface FieldsRelationship {
  id: string;
  relationship: RelationOne;
  relationshipHasMany: RelationOne[];
  relationshipMultiple: Array<RelationOne | RelationTwo>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RelationOne {
  id: string;
  name: string;
}
export type RelationTwo = RelationOne;
export type RelationRestricted = RelationOne;

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
          name: 'relationshipRestricted',
          relationTo: relationRestrictedSlug,
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
  ],
  onInit: async (payload) => {
    // Create docs to relate to
    await payload.create<RelationOne>({
      collection: relationOneSlug,
      data: {
        name: relationOneSlug,
      },
    });

    await payload.create<RelationOne>({
      collection: relationOneSlug,
      data: {
        name: relationOneSlug,
      },
    });

    await payload.create<RelationTwo>({
      collection: relationTwoSlug,
      data: {
        name: relationTwoSlug,
      },
    });

    const { id: restrictedDocId } = await payload.create<RelationRestricted>({
      collection: relationRestrictedSlug,
      data: {
        name: 'relation-restricted',
      },
    });

    await payload.create<RelationOne>({
      collection: slug,
      data: {
        name: 'with-relation-to-restricted',
        relationshipRestricted: restrictedDocId,
      },
    });
  },
});
