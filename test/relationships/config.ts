import type { CollectionConfig } from '../../packages/payload/src/collections/config/types'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'

const openAccess = {
  create: () => true,
  delete: () => true,
  read: () => true,
  update: () => true,
}

const defaultAccess = ({ req: { user } }) => Boolean(user)

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
        admin: {
          position: 'sidebar',
        },
        required: true,
      },
    ],
  }
}

export const slug = 'posts'
export const slugWithLocalizedRel = 'postsLocalized'
export const relationSlug = 'relation'
export const defaultAccessRelSlug = 'strict-access'
export const chainedRelSlug = 'chained'
export const customIdSlug = 'custom-id'
export const customIdNumberSlug = 'custom-id-number'
export const polymorphicRelationshipsSlug = 'polymorphic-relationships'
export const treeSlug = 'tree'

export default buildConfigWithDefaults({
  localization: {
    locales: ['en', 'de'],
    defaultLocale: 'en',
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
          type: 'relationship',
          maxDepth: 0,
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
          filterOptions: {
            disableRelation: {
              not_equals: true,
            },
          },
          relationTo: relationSlug,
        },
      ],
    },
    {
      slug: slugWithLocalizedRel,
      access: openAccess,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        // Relationship
        {
          name: 'relationField',
          type: 'relationship',
          relationTo: relationSlug,
          localized: true,
        },
      ],
    },
    collectionWithName(relationSlug),
    {
      ...collectionWithName(defaultAccessRelSlug),
      access: {
        create: defaultAccess,
        delete: defaultAccess,
        read: defaultAccess,
        update: defaultAccess,
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
        {
          name: 'movies',
          type: 'relationship',
          hasMany: true,
          relationTo: 'movies',
        },
      ],
    },
    {
      slug: 'movieReviews',

      fields: [
        {
          name: 'movieReviewer',
          type: 'relationship',
          relationTo: 'users',
          required: true,
        },
        {
          name: 'likes',
          type: 'relationship',
          hasMany: true,
          relationTo: 'users',
        },
        {
          name: 'visibility',
          type: 'radio',
          options: [
            {
              label: 'followers',
              value: 'followers',
            },
            {
              label: 'public',
              value: 'public',
            },
          ],
          required: true,
        },
      ],
    },
    {
      slug: polymorphicRelationshipsSlug,
      fields: [
        {
          name: 'polymorphic',
          type: 'relationship',
          relationTo: ['movies'],
        },
      ],
    },
    {
      slug: treeSlug,
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'parent',
          type: 'relationship',
          relationTo: 'tree',
        },
      ],
    },
    {
      slug: 'pages',
      fields: [
        {
          type: 'array',
          name: 'menu',
          fields: [
            {
              name: 'label',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      slug: 'rels-to-pages',
      fields: [
        {
          name: 'page',
          type: 'relationship',
          relationTo: 'pages',
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
    })

    const rel1 = await payload.create({
      collection: relationSlug,
      data: {
        name: 'name',
      },
    })

    const rel2 = await payload.create({
      collection: relationSlug,
      data: {
        name: 'another name',
      },
    })

    const filteredRelation = await payload.create({
      collection: relationSlug,
      data: {
        name: 'filtered',
      },
    })

    const defaultAccessRelation = await payload.create({
      collection: defaultAccessRelSlug,
      data: {
        name: 'name',
      },
    })

    const chained3 = await payload.create({
      collection: chainedRelSlug,
      data: {
        name: 'chain3',
      },
    })

    const chained2 = await payload.create({
      collection: chainedRelSlug,
      data: {
        name: 'chain2',
        relation: chained3.id,
      },
    })

    const chained = await payload.create({
      collection: chainedRelSlug,
      data: {
        name: 'chain1',
        relation: chained2.id,
      },
    })

    await payload.update({
      id: chained3.id,
      collection: chainedRelSlug,
      data: {
        name: 'chain3',
        relation: chained.id,
      },
    })

    const customIdRelation = await payload.create({
      collection: customIdSlug,
      data: {
        id: 'custommmm',
        name: 'custom-id',
      },
    })

    const customIdNumberRelation = await payload.create({
      collection: customIdNumberSlug,
      data: {
        id: 908234892340,
        name: 'custom-id',
      },
    })

    // Relationship
    await payload.create({
      collection: slug,
      data: {
        chainedRelation: chained.id,
        customIdNumberRelation: customIdNumberRelation.id,
        customIdRelation: customIdRelation.id,
        defaultAccessRelation: defaultAccessRelation.id,
        filteredRelation: filteredRelation.id,
        maxDepthRelation: rel1.id,
        relationField: rel1.id,
        title: 'with relationship',
      },
    })

    const root = await payload.create({
      collection: 'tree',
      data: {
        text: 'root',
      },
    })

    await payload.create({
      collection: 'tree',
      data: {
        parent: root.id,
        text: 'sub',
      },
    })
  },
})
