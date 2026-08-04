import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const postsSlug = 'posts'
export const categoriesSlug = 'categories'

export default buildConfigWithDefaults({
  collections: [
    {
      slug: postsSlug,
      access: {
        read: () => true,
        create: () => true,
        update: () => true,
        delete: () => true,
      },
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
          name: 'category',
          type: 'relationship',
          relationTo: categoriesSlug,
        },
      ],
    },
    {
      slug: categoriesSlug,
      access: {
        read: () => true,
        create: () => true,
        update: () => true,
        delete: () => true,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
  ],
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'schema.graphql'),
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
