import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { postsSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// The admin is served by the prebuilt `@payloadcms/admin-runtime`, see app/(payload)/admin.
export default buildConfigWithDefaults({
  suite: 'admin-runtime',
  config: {
    admin: {
      components: {
        beforeDashboard: ['/components/BeforeDashboard/index.js#BeforeDashboard'],
      },
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      {
        slug: postsSlug,
        admin: {
          useAsTitle: 'title',
        },
        fields: [
          {
            name: 'title',
            type: 'text',
          },
          {
            name: 'content',
            type: 'richText',
          },
        ],
      },
    ],
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: devUser,
      overrideAccess: true,
    })
  },
})
