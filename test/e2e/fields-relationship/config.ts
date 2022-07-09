import { buildConfig } from '../buildConfig';

export const slug = 'fields-relationship';

export const relationOneSlug = 'relation-one';
export const relationTwoSlug = 'relation-two';


export interface FieldsRelationship {
  id: string
  relationship: RelationOne
  relationshipHasMany: RelationOne[]
  relationshipMultiple: Array<RelationOne | RelationTwo>
  createdAt: Date,
  updatedAt: Date,
}

export interface RelationOne {
  id: string,
  name: string,
}
export type RelationTwo = RelationOne

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

      ],
    },
    {
      slug: relationOneSlug,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    {
      slug: relationTwoSlug,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
  ],
  onInit: async (payload) => {
    // Create docs to relate to
    await payload.create<RelationOne>({
      collection: relationOneSlug,
      data: {
        name: 'relation',
      },
    });

    await payload.create<RelationOne>({
      collection: relationOneSlug,
      data: {
        name: 'relation',
      },
    });

    await payload.create<RelationTwo>({
      collection: relationTwoSlug,
      data: {
        name: 'second-relation',
      },
    });
  },
});
