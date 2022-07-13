import type { CollectionConfig } from '../../../src/collections/config/types';
import { buildConfig } from '../buildConfig';

export interface Post {
  id: string;
  title: string;
  description?: string;
  number?: number;
  relationField?: Relation | string
  relationHasManyField?: RelationHasMany[] | string[]
  relationMultiRelationTo?: { relationTo: string, value: string }
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

const collectionWithName = (collectionSlug: string): CollectionConfig => {
  return {
    slug: collectionSlug,
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
    // collectionWithName(relationMultiSlug),
    collectionWithName('dummy'),
  ],
  onInit: async (payload) => {
    // Relation - hasMany
    const rel1 = await payload.create<RelationHasMany>({
      collection: relationHasManySlug,
      data: {
        name: 'name',
      },
    });
    await payload.create<Post>({
      collection: slug,
      data: {
        title: 'rel to hasMany',
        relationHasManyField: rel1.id,
      },
    });

    // Relation - relationTo multi
    const rel2 = await payload.create<Relation>({
      collection: relationSlug,
      data: {
        name: 'multi',
      },
    });
    await payload.create<Post>({
      collection: slug,
      data: {
        title: 'rel to multi',
        relationMultiRelationTo: {
          relationTo: relationSlug,
          value: rel2.id,
        },
      },
    });
  },

});
