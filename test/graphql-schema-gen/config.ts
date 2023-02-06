import path from 'path';
import type { CollectionConfig } from '../../src/collections/config/types';
import { buildConfig } from '../buildConfig';

export interface Relation {
  id: string;
  name: string;
}

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
export const relationSlug = 'relation';
export default buildConfig({
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
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
          relationTo: relationSlug,
          hasMany: true,
        },
        // Relation multiple relationTo
        {
          name: 'relationMultiRelationTo',
          type: 'relationship',
          relationTo: [relationSlug, 'dummy'],
        },
        // Relation multiple relationTo hasMany
        {
          name: 'relationMultiRelationToHasMany',
          type: 'relationship',
          relationTo: [relationSlug, 'dummy'],
          hasMany: true,
        },
      ],
    },
    collectionWithName(relationSlug),
    collectionWithName('dummy'),
  ],
});
