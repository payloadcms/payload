import { Payload } from '../../src';
import type { CollectionConfig } from '../../src/collections/config/types';
import { devUser } from '../credentials';
import { buildConfig } from '../buildConfig';
import type { CustomIdNumberRelation, CustomIdRelation, Post, Relation } from './payload-types';
import { ChainedRelation } from './payload-types';
import { mapAsync } from '../../src/utilities/mapAsync';

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
export const cascadingSlug = 'cascading';
export const cascadingHasManySlug = 'cascading-has-many';
export const cascadingPolySlug = 'cascading-poly';
export const cascadingHasManyPolySlug = 'cascading-has-many-poly';
export const cascadingNested = 'cascading-nested';

export const seedCascadeRelationships = async (payload: Payload): Promise<void> => {
  const cascadingIDs = [];
  await mapAsync([...Array(6)], async (ignore, i) => {
    const doc = await payload.create({
      collection: relationSlug,
      data: {
        name: `cascading ${i}`,
      },
    });
    cascadingIDs.push(doc.id);
  });
  const cascadingSlugIDs = [];
  await mapAsync([...Array(2)], async (i) => {
    const doc = await payload.create({
      collection: slug,
      data: {
        name: `cascading ${i}`,
      },
    });
    cascadingSlugIDs.push(doc.id);
  });

  // cascading hooks
  await payload.create({
    collection: cascadingSlug,
    data: {
      relation: cascadingIDs.shift(),
    },
  });

  await payload.create({
    collection: cascadingHasManySlug,
    data: {
      relation: [cascadingIDs.shift(), cascadingIDs.shift()],
    },
  });

  await payload.create({
    collection: cascadingPolySlug,
    data: {
      relation: { value: cascadingSlugIDs.shift(), relationTo: slug },
    },
  });

  await payload.create({
    collection: cascadingHasManyPolySlug,
    data: {
      relation: [{
        value: cascadingIDs.shift(),
        relationTo: relationSlug,
      }, {
        value: cascadingSlugIDs.shift(),
        relationTo: slug,
      }],
    },
  });
};

export default buildConfig({
  collections: [
    // TODO: cascade working only when relationship fields come before relationTo
    {
      slug: cascadingSlug,
      fields: [
        {
          type: 'relationship',
          name: 'relation',
          relationTo: relationSlug,
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
          relationTo: relationSlug,
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
          relationTo: [slug, relationSlug],
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
          relationTo: [slug, relationSlug],
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
              relationTo: relationSlug,
              cascade: true,
            }],
        },
      ],
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
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    });

    const rel1 = await payload.create<Relation>({
      collection: relationSlug,
      data: {
        name: 'name',
      },
    });

    const filteredRelation = await payload.create<Relation>({
      collection: relationSlug,
      data: {
        name: 'filtered',
      },
    });

    const defaultAccessRelation = await payload.create<Relation>({
      collection: defaultAccessRelSlug,
      data: {
        name: 'name',
      },
    });

    const chained3 = await payload.create<ChainedRelation>({
      collection: chainedRelSlug,
      data: {
        name: 'chain3',
      },
    });

    const chained2 = await payload.create<ChainedRelation>({
      collection: chainedRelSlug,
      data: {
        name: 'chain2',
        relation: chained3.id,
      },
    });

    const chained = await payload.create<ChainedRelation>({
      collection: chainedRelSlug,
      data: {
        name: 'chain1',
        relation: chained2.id,
      },
    });

    await payload.update<ChainedRelation>({
      collection: chainedRelSlug,
      id: chained3.id,
      data: {
        name: 'chain3',
        relation: chained.id,
      },
    });

    const customIdRelation = await payload.create<CustomIdRelation>({
      collection: customIdSlug,
      data: {
        id: 'custommmm',
        name: 'custom-id',
      },
    });

    const customIdNumberRelation = await payload.create<CustomIdNumberRelation>({
      collection: customIdNumberSlug,
      data: {
        id: 908234892340,
        name: 'custom-id',
      },
    });


    // Relationship
    await payload.create<Post>({
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

    await seedCascadeRelationships(payload);
  },
});
