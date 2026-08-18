import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import type { CollectionConfig } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { seed } from './seed.js'
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
    versions: false,
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
      versions: false,
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
      versions: false,
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
      versions: false,
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
      versions: false,
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
      versions: false,
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
      versions: false,
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
      versions: false,
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
          name: 'select',
          type: 'select',
          hasMany: true,
          options: ['a', 'b', 'c'],
        },
        {
          name: 'director',
          type: 'relationship',
          relationTo: 'directors',
        },
        {
          type: 'array',
          name: 'array',
          fields: [
            {
              name: 'director',
              type: 'relationship',
              relationTo: 'directors',
              hasMany: true,
            },
            {
              name: 'polymorphic',
              type: 'relationship',
              relationTo: ['directors'],
            },
          ],
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
          name: 'movie',
          type: 'relationship',
          relationTo: 'movies',
        },
        {
          name: 'directors',
          type: 'relationship',
          relationTo: 'directors',
          hasMany: true,
        },
      ],
      versions: false,
    },
    {
      slug: 'transitive-join-songs',
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'albums',
          type: 'relationship',
          relationTo: 'transitive-join-albums',
          hasMany: true,
        },
      ],
    },
    {
      slug: 'transitive-join-albums',
      fields: [
        {
          name: 'artist',
          type: 'relationship',
          relationTo: 'transitive-join-artists',
        },
        {
          name: 'song',
          type: 'join',
          collection: 'transitive-join-songs',
          on: 'albums',
        },
      ],
    },
    {
      slug: 'transitive-join-artists',
      fields: [
        {
          name: 'album',
          type: 'join',
          collection: 'transitive-join-albums',
          on: 'artist',
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
      versions: false,
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
      versions: false,
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
      versions: false,
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
      versions: false,
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
      versions: false,
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
      versions: false,
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
      versions: false,
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
      versions: false,
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
      versions: false,
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
      versions: false,
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
                {
                  type: 'relationship',
                  hasMany: true,
                  name: 'directors',
                  relationTo: 'directors',
                  localized: true,
                },
              ],
            },
          ],
        },
      ],
      versions: false,
    },
  ],
  onInit: async (payload) => {
    if (process.env.SEED_IN_CONFIG_ONINIT !== 'false') {
      await seed(payload)
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
