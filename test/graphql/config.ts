import { GraphQL } from '@payloadcms/graphql/types'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { ContentBlock } from './blocks/ContentBlock.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  suite: 'graphql',
  config: {
    // ...extend config here
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      {
        slug: 'posts',
        fields: [
          {
            name: 'title',
            type: 'text',
            label: 'Title',
          },
          {
            name: 'hyphenated-name',
            type: 'text',
          },
          {
            name: 'relationToSelf',
            type: 'relationship',
            graphQL: {
              complexity: 801,
            },
            relationTo: 'posts',
          },
          {
            name: 'contentBlockField',
            type: 'blocks',
            blocks: [ContentBlock],
          },
        ],
        versions: false,
      },
      {
        slug: 'virtual-fields',
        fields: [
          {
            name: 'post',
            type: 'relationship',
            relationTo: 'posts',
          },
          {
            // A required field that is NOT virtual - stays non-null in the GraphQL schema
            name: 'requiredTitle',
            type: 'text',
            required: true,
          },
          {
            // Required + virtual (computed by a hook) - must be nullable in the GraphQL schema
            name: 'virtualComputed',
            type: 'text',
            hooks: {
              afterRead: [({ data }) => `computed-${data?.requiredTitle ?? ''}`],
            },
            required: true,
            virtual: true,
          },
          {
            // Required + virtual linked to a relationship path - must also be nullable
            name: 'virtualFromRelation',
            type: 'text',
            required: true,
            virtual: 'post.title',
          },
        ],
        versions: false,
      },
    ],
    globals: [
      {
        slug: 'home',
        fields: [
          {
            name: 'topPosts',
            type: 'array',
            fields: [
              {
                name: 'post',
                type: 'relationship',
                relationTo: 'posts',
                required: true,
              },
              {
                name: 'caption',
                type: 'text',
              },
            ],
            required: true,
          },
        ],
        versions: { drafts: true },
      },
    ],
    graphQL: {
      maxComplexity: 800,
      validationRules: () => [NoIntrospection],
    },
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
})

const NoIntrospection: GraphQL.ValidationRule = (context) => ({
  Field(node) {
    if (node.name.value === '__schema' || node.name.value === '__type') {
      context.reportError(
        new GraphQL.GraphQLError(
          'GraphQL introspection is not allowed, but the query contained __schema or __type',
          { nodes: [node] },
        ),
      )
    }
  },
})
