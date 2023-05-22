import type { CollectionConfig } from '../../src/collections/config/types';
import { devUser } from '../credentials';
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
  collections: [
    {
      slug: 'users',
      auth: true,
      access: openAccess,
      fields: [],
    },
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
        {
          name: 'min',
          type: 'number',
          min: 10,
        },
        // Relationship
        {
          name: 'relationField',
          type: 'relationship',
          relationTo: relationSlug,
        },
        {
          name: 'relationToCustomID',
          type: 'relationship',
          relationTo: 'custom-ids',
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
    {
      slug: 'custom-ids',
      fields: [
        {
          name: 'id',
          type: 'number',
        },
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    collectionWithName(relationSlug),
    collectionWithName('dummy'),
  ],
  onInit: async payload => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    });

    await payload.create({
      collection: 'custom-ids',
      data: {
        id: 1,
        title: 'hello',
      },
    });

    await payload.create({
      collection: slug,
      data: {
        title: 'post1',
        relationToCustomID: 1,
      },
    });
    await payload.create({
      collection: slug,
      data: {
        title: 'post2',
      },
    });

    await payload.create({
      collection: slug,
      data: {
        title: 'with-description',
        description: 'description',
      },
    });

    await payload.create({
      collection: slug,
      data: {
        title: 'numPost1',
        number: 1,
      },
    });
    await payload.create({
      collection: slug,
      data: {
        title: 'numPost2',
        number: 2,
      },
    });

    const rel1 = await payload.create({
      collection: relationSlug,
      data: {
        name: 'name',
      },
    });
    const rel2 = await payload.create({
      collection: relationSlug,
      data: {
        name: 'name2',
      },
    });

    // Relation - hasMany
    await payload.create({
      collection: slug,
      data: {
        title: 'rel to hasMany',
        relationHasManyField: rel1.id,
      },
    });
    await payload.create({
      collection: slug,
      data: {
        title: 'rel to hasMany 2',
        relationHasManyField: rel2.id,
      },
    });

    // Relation - relationTo multi
    await payload.create({
      collection: slug,
      data: {
        title: 'rel to multi',
        relationMultiRelationTo: {
          relationTo: relationSlug,
          value: rel2.id,
        },
      },
    });

    // Relation - relationTo multi hasMany
    await payload.create({
      collection: slug,
      data: {
        title: 'rel to multi hasMany',
        relationMultiRelationToHasMany: [
          {
            relationTo: relationSlug,
            value: rel1.id,
          },
          {
            relationTo: relationSlug,
            value: rel2.id,
          },
        ],
      },
    });
  },
});
