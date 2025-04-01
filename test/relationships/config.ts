import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import type { CollectionConfig } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import {
  chainedRelSlug,
  customIdNumberSlug,
  customIdSlug,
  defaultAccessRelSlug,
  polymorphicRelationshipsSlug,
  relationSlug,
  slug,
  slugWithLocalizedRel,
  treeSlug,
} from './shared.js'

const openAccess = {
  create: () => true,
  read: () => true,
  update: () => true,
  delete: () => true,
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
        required: true,
        admin: {
          position: 'sidebar',
        },
      },
    ],
  }
}

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
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
        {
          name: 'blocks',
          type: 'blocks',
          blocks: [
            {
              slug: 'block',
              fields: [
                {
                  name: 'relationField',
                  type: 'relationship',
                  relationTo: relationSlug,
                },
              ],
            },
          ],
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
      versions: { drafts: true },
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
          name: 'localized',
          type: 'text',
          localized: true,
        },
        {
          name: 'movies',
          type: 'relationship',
          relationTo: 'movies',
          hasMany: true,
        },
        {
          name: 'directors',
          type: 'relationship',
          relationTo: 'directors',
          hasMany: true,
        },
      ],
    },
    {
      slug: 'movieReviews',
      fields: [
        {
          name: 'movieReviewer',
          relationTo: 'users',
          required: true,
          type: 'relationship',
        },
        {
          name: 'likes',
          hasMany: true,
          relationTo: 'users',
          type: 'relationship',
        },
        {
          name: 'visibility',
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
          type: 'radio',
        },
      ],
    },
    {
      slug: polymorphicRelationshipsSlug,
      fields: [
        {
          type: 'relationship',
          name: 'polymorphic',
          relationTo: ['movies'],
        },
        {
          type: 'relationship',
          name: 'polymorphicLocalized',
          relationTo: ['movies'],
          localized: true,
        },
        {
          type: 'relationship',
          name: 'polymorphicMany',
          hasMany: true,
          relationTo: ['movies'],
        },
        {
          type: 'relationship',
          hasMany: true,
          name: 'polymorphicManyLocalized',
          localized: true,
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
    {
      slug: 'rels-to-pages-and-custom-text-ids',
      fields: [
        {
          name: 'rel',
          type: 'relationship',
          relationTo: ['pages', 'custom-id', 'custom-id-number'],
        },
      ],
    },
    {
      slug: 'object-writes',
      fields: [
        {
          type: 'relationship',
          relationTo: 'movies',
          name: 'one',
        },
        {
          type: 'relationship',
          relationTo: 'movies',
          name: 'many',
          hasMany: true,
        },
        {
          type: 'relationship',
          relationTo: ['movies'],
          name: 'onePoly',
        },
        {
          type: 'relationship',
          relationTo: ['movies'],
          name: 'manyPoly',
          hasMany: true,
        },
      ],
    },
    {
      slug: 'deep-nested',
      fields: [
        {
          type: 'tabs',
          tabs: [
            {
              name: 'content',
              fields: [
                {
                  type: 'blocks',
                  name: 'blocks',
                  blocks: [
                    {
                      slug: 'testBlock',
                      fields: [
                        {
                          type: 'tabs',
                          tabs: [
                            {
                              name: 'meta',
                              fields: [
                                {
                                  type: 'relationship',
                                  relationTo: 'movies',
                                  name: 'movie',
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: 'relations',
      fields: [
        {
          name: 'item',
          type: 'relationship',
          relationTo: ['items'],
        },
      ],
    },
    {
      slug: 'items',
      fields: [
        {
          type: 'select',
          options: ['completed', 'failed', 'pending'],
          name: 'status',
        },
        {
          type: 'join',
          on: 'item',
          collection: 'relations',
          name: 'relation',
        },
      ],
    },
    {
      slug: 'blocks',
      fields: [
        {
          type: 'blocks',
          name: 'blocks',
          blocks: [
            {
              slug: 'some',
              fields: [
                {
                  type: 'relationship',
                  relationTo: 'directors',
                  name: 'director',
                },
              ],
            },
          ],
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
      collection: chainedRelSlug,
      id: chained3.id,
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
        title: 'with relationship',
        relationField: rel1.id,
        defaultAccessRelation: defaultAccessRelation.id,
        chainedRelation: chained.id,
        maxDepthRelation: rel1.id,
        customIdRelation: customIdRelation.id,
        customIdNumberRelation: customIdNumberRelation.id,
        filteredRelation: filteredRelation.id,
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
        text: 'sub',
        parent: root.id,
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
