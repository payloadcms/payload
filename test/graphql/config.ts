import { GraphQL } from '@payloadcms/graphql/types'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

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
    validationRules: () => [NoIntrospection],
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
