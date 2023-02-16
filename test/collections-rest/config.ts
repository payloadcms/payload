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
export const pointSlug = 'point';
export const customIdSlug = 'custom-id';
export const customIdNumberSlug = 'custom-id-number';

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
      slug: pointSlug,
      access: openAccess,
      fields: [
        {
          type: 'point',
          name: 'point',
        },
      ],
    },
    collectionWithName(relationSlug),
    collectionWithName('dummy'),
    {
      slug: customIdSlug,
      access: openAccess,
      fields: [
        {
          name: 'id',
          type: 'text',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'name',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      slug: customIdNumberSlug,
      access: openAccess,
      fields: [
        {
          name: 'id',
          type: 'number',
        },
        {
          name: 'name',
          type: 'text',
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

    await payload.create({
      collection: pointSlug,
      data: {
        point: [10, 20],
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

    await payload.create({
      collection: customIdSlug,
      data: {
        id: 'test',
        name: 'inside row',
      },
    });

    await payload.create({
      collection: customIdNumberSlug,
      data: {
        id: 123,
        name: 'name',
      },
    });
  },
});
