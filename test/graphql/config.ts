import { GraphQL } from '@payloadcms/graphql/types'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { opsCounterPlugin } from './opsCounter.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          label: 'Title',
          type: 'text',
        },
        {
          name: 'hyphenated-name',
          type: 'text',
        },
        {
          type: 'relationship',
          relationTo: 'posts',
          name: 'relationToSelf',
          graphQL: {
            complexity: 801,
          },
        },
        {
          name: 'slug',
          type: 'text',
        },
      ],
    },
    {
      slug: 'posts-2',
      fields: [
        {
          name: 'title',
          label: 'Title',
          type: 'text',
        },
        {
          name: 'slug',
          type: 'text',
        },
      ],
    },
    {
      slug: 'posts-3',
      fields: [
        {
          name: 'title',
          label: 'Title',
          type: 'text',
        },
        {
          name: 'slug',
          type: 'text',
        },
      ],
    },
    {
      slug: 'posts-4',
      fields: [
        {
          name: 'title',
          label: 'Title',
          type: 'text',
        },
        {
          name: 'slug',
          type: 'text',
        },
      ],
    },
    {
      slug: 'posts-5',
      fields: [
        {
          name: 'title',
          label: 'Title',
          type: 'text',
        },
        {
          name: 'slug',
          type: 'text',
        },
      ],
    },
    {
      slug: 'posts-6',
      fields: [
        {
          name: 'title',
          label: 'Title',
          type: 'text',
        },
        {
          name: 'slug',
          type: 'text',
        },
      ],
    },
  ],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  graphQL: {
    maxComplexity: 800,
    // validationRules: () => [NoIntrospection],
  },
  plugins: [
    opsCounterPlugin({
      warnAt: 5,
      max: 20,
    }),
  ],
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
