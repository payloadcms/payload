import type { CollectionConfig } from '../../src/collections/config/types';
import { devUser } from '../credentials';
import { buildConfig } from '../buildConfig';

const openAccess = {
  create: () => true,
  read: () => true,
  update: () => true,
  delete: () => true,
};

const defaultAccess = ({ req: { user } }) => Boolean(user);

const collectionWithName = (collectionSlug: string): CollectionConfig => {
  return {
    slug: collectionSlug,
    access: openAccess,
    admin: {
      useAsTitle: 'name',
    },
    fields: [
      {
        name: 'name',
        type: 'text',
      },
      {
        name: 'disableRelation', // used filteredRelation
        type: 'checkbox',
        required: true,
        admin: {
          position: 'sidebar',
        },
      },
    ],
  };
};

export const slug = 'posts';
export const relationSlug = 'relation';
export const defaultAccessRelSlug = 'strict-access';
export const chainedRelSlug = 'chained-relation';
export const customIdSlug = 'custom-id-relation';
export const customIdNumberSlug = 'custom-id-number-relation';
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
        // Relationship w/ default access
        {
          name: 'defaultAccessRelation',
          type: 'relationship',
          relationTo: defaultAccessRelSlug,
        },
        {
          name: 'chainedRelation',
          type: 'relationship',
          relationTo: chainedRelSlug,
        },
        {
          name: 'maxDepthRelation',
          maxDepth: 0,
          type: 'relationship',
          relationTo: relationSlug,
        },
        {
          name: 'customIdRelation',
          type: 'relationship',
          relationTo: customIdSlug,
        },
        {
          name: 'customIdNumberRelation',
          type: 'relationship',
          relationTo: customIdNumberSlug,
        },
        {
          name: 'filteredRelation',
          type: 'relationship',
          relationTo: relationSlug,
          filterOptions: {
            disableRelation: {
              not_equals: true,
            },
          },
        },
      ],
    },
    collectionWithName(relationSlug),
    {
      ...collectionWithName(defaultAccessRelSlug),
      access: {
        create: defaultAccess,
        read: defaultAccess,
        update: defaultAccess,
        delete: defaultAccess,
      },
    },
    {
      slug: chainedRelSlug,
      access: openAccess,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'relation',
          type: 'relationship',
          relationTo: chainedRelSlug,
        },
      ],
    },
    {
      slug: customIdSlug,
      fields: [
        {
          name: 'id',
          type: 'text',
        },
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    {
      slug: customIdNumberSlug,
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
    {
      slug: 'screenings',
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'movie',
          type: 'relationship',
          relationTo: 'movies',
        },
      ],
    },
    {
      slug: 'movies',
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'director',
          type: 'relationship',
          relationTo: 'directors',
        },
      ],
    },
    {
      slug: 'directors',
      fields: [
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

    const filteredRelation = await payload.create({
      collection: relationSlug,
      data: {
        name: 'filtered',
      },
    });

    const defaultAccessRelation = await payload.create({
      collection: defaultAccessRelSlug,
      data: {
        name: 'name',
      },
    });

    const chained3 = await payload.create({
      collection: chainedRelSlug,
      data: {
        name: 'chain3',
      },
    });

    const chained2 = await payload.create({
      collection: chainedRelSlug,
      data: {
        name: 'chain2',
        relation: chained3.id,
      },
    });

    const chained = await payload.create({
      collection: chainedRelSlug,
      data: {
        name: 'chain1',
        relation: chained2.id,
      },
    });

    await payload.update({
      collection: chainedRelSlug,
      id: chained3.id,
      data: {
        name: 'chain3',
        relation: chained.id,
      },
    });

    const customIdRelation = await payload.create({
      collection: customIdSlug,
      data: {
        id: 'custommmm',
        name: 'custom-id',
      },
    });

    const customIdNumberRelation = await payload.create({
      collection: customIdNumberSlug,
      data: {
        id: 908234892340,
        name: 'custom-id',
      },
    });

    // Relationship
    await payload.create({
      collection: slug,
      data: {
        title: 'with relationship',
        relationField: rel1.id,
        defaultAccessRelation: defaultAccessRelation.id,
        chainedRelation: chained.id,
        maxDepthRelation: rel1.id,
        customIdRelation: customIdRelation.id,
        customIdNumberRelation: customIdNumberRelation.id,
        filteredRelation: filteredRelation.id,
      },
    });
  },
});
