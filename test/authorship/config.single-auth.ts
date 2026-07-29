import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { menuSlug, postsSlug, usersSlug } from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Single auth collection — guards that authorship storage stays polymorphic
// (`{ relationTo, value }`) regardless of auth-collection count.
export default buildConfigWithDefaults({
  collections: [
    {
      slug: usersSlug,
      auth: true,
      fields: [],
    },
    {
      // Default authorship: both createdBy and updatedBy
      slug: postsSlug,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
  ],
  globals: [
    {
      // Default authorship on a global
      slug: menuSlug,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: usersSlug,
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
