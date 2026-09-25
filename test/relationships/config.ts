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
    versions: false,
  }
}

export default buildConfigWithDefaults({
  suite: 'relationships',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
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
            localized: true,
            relationTo: relationSlug,
          },
          // Localized array wrapping a relationship to a collection that owns a non-localized hasMany relationship
          {
            name: 'localizedDirectors',
            type: 'array',
            fields: [
              {
                name: 'director',
                type: 'relationship',
                relationTo: 'directors',
              },
            ],
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
          delete: defaultAccess,
          read: defaultAccess,
          update: defaultAccess,
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
            name: 'location',
            type: 'point',
          },
          {
            name: 'director',
            type: 'relationship',
            relationTo: 'directors',
          },
          {
            name: 'array',
            type: 'array',
            fields: [
              {
                name: 'director',
                type: 'relationship',
                hasMany: true,
                relationTo: 'directors',
              },
              {
                name: 'polymorphic',
                type: 'relationship',
                relationTo: ['directors'],
              },
            ],
          },
        ],
        versions: { drafts: true },
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
            hasMany: true,
            relationTo: 'movies',
          },
          {
            name: 'movie',
            type: 'relationship',
            relationTo: 'movies',
          },
          {
            name: 'directors',
            type: 'relationship',
            hasMany: true,
            relationTo: 'directors',
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
            hasMany: true,
            relationTo: 'transitive-join-albums',
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
        versions: false,
      },
      {
        slug: polymorphicRelationshipsSlug,
        fields: [
          {
            name: 'polymorphic',
            type: 'relationship',
            relationTo: ['movies'],
          },
          {
            name: 'polymorphicLocalized',
            type: 'relationship',
            localized: true,
            relationTo: ['movies'],
          },
          {
            name: 'polymorphicMany',
            type: 'relationship',
            hasMany: true,
            relationTo: ['movies'],
          },
          {
            name: 'polymorphicManyLocalized',
            type: 'relationship',
            hasMany: true,
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
            name: 'menu',
            type: 'array',
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
            name: 'one',
            type: 'relationship',
            relationTo: 'movies',
          },
          {
            name: 'many',
            type: 'relationship',
            hasMany: true,
            relationTo: 'movies',
          },
          {
            name: 'onePoly',
            type: 'relationship',
            relationTo: ['movies'],
          },
          {
            name: 'manyPoly',
            type: 'relationship',
            hasMany: true,
            relationTo: ['movies'],
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
                    name: 'blocks',
                    type: 'blocks',
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
                                    name: 'movie',
                                    type: 'relationship',
                                    relationTo: 'movies',
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
            name: 'status',
            type: 'select',
            options: ['completed', 'failed', 'pending'],
          },
          {
            name: 'relation',
            type: 'join',
            collection: 'relations',
            on: 'item',
          },
        ],
        versions: false,
      },
      {
        slug: 'blocks',
        fields: [
          {
            name: 'blocks',
            type: 'blocks',
            blocks: [
              {
                slug: 'some',
                fields: [
                  {
                    name: 'director',
                    type: 'relationship',
                    relationTo: 'directors',
                  },
                  {
                    name: 'directors',
                    type: 'relationship',
                    hasMany: true,
                    localized: true,
                    relationTo: 'directors',
                  },
                ],
              },
            ],
          },
        ],
        versions: false,
      },
    ],
    localization: {
      defaultLocale: 'en',
      locales: ['en', 'de'],
    },
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed,
})
