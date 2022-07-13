import type { CollectionConfig } from '../../../src/collections/config/types';
import { buildConfig } from '../buildConfig';

export interface Post {
  id: string;
  title: string;
  description?: string;
  number?: number;
  relationField?: Relation | string
  relationHasManyField?: RelationHasMany[] | string[]
  relationMultiRelationTo?: Relation[] | string[]
}

export interface Relation {
  id: string
  name: string
}

export type RelationHasMany = Relation

const openAccess = {
  create: () => true,
  read: () => true,
  update: () => true,
  delete: () => true,
};

const collectionWithName = (slug: string): CollectionConfig => {
  return {
    slug,
    access: openAccess,
    fields: [
      {
        name: 'name',
        type: 'text',
      },
    ],
  };
};

export const slug = 'posts';
export const relationSlug = 'relation-normal';
export const relationHasManySlug = 'relation-has-many';
export const relationMultipleRelationToSlug = 'relation-multi-relation-to';
export default buildConfig({
  collections: [
    {
      slug,
      access: openAccess,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'description',
          type: 'text',
        },
        {
          name: 'number',
          type: 'number',
        },
        // Relationship
        {
          name: 'relationField',
          type: 'relationship',
          relationTo: relationSlug,
        },
        // Relation hasMany
        {
          name: 'relationHasManyField',
          type: 'relationship',
          relationTo: relationHasManySlug,
          hasMany: true,
        },
        // Relation multiple relationTo
        {
          name: 'relationMultiRelationTo',
          type: 'relationship',
          relationTo: [relationSlug, 'dummy'],
        },
      ],
    },
    collectionWithName(relationSlug),
    collectionWithName(relationHasManySlug),
    collectionWithName('dummy'),
  ],
  onInit: async (payload) => {
    const rel1 = await payload.create<RelationHasMany>({
      collection: relationHasManySlug,
      data: {
        name: 'name',
      },
    });

    await payload.create({
      collection: slug,
      data: {
        title: 'title',
        relationHasManyField: rel1.id,
      },
    });
  },

});
