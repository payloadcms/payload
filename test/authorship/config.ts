import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import {
  adminsSlug,
  createdOnlySlug,
  draftPostsSlug,
  menuSlug,
  noAuthorshipSlug,
  postsSlug,
  usersSlug,
} from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults(
  {
    collections: [
      {
        slug: usersSlug,
        auth: true,
        access: {
          // Users can only read their own record — used to verify that authorship
          // relationships fall back to an id reference when the reader lacks access.
          read: ({ req: { user } }) => (user ? { id: { equals: user.id } } : false),
        },
        fields: [],
      },
      {
        slug: adminsSlug,
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
      {
        // Drafts enabled so the version compare (diff) view can be exercised in e2e
        slug: draftPostsSlug,
        fields: [
          {
            name: 'title',
            type: 'text',
          },
        ],
        versions: {
          drafts: true,
        },
      },
      {
        // Authorship disabled entirely
        slug: noAuthorshipSlug,
        authorship: false,
        fields: [
          {
            name: 'title',
            type: 'text',
          },
        ],
      },
      {
        // Only createdBy tracked
        slug: createdOnlySlug,
        authorship: { updatedBy: false },
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

      // A second user used by access-control tests; `users` read is restricted to own record.
      await payload.create({
        collection: usersSlug,
        data: {
          email: 'other@payloadcms.com',
          password: devUser.password,
        },
      })
    },
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  {
    disableAutoLogin: true,
  },
)
