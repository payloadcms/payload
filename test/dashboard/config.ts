import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      afterDashboard: ['./components/BeforeOrAfterDashboard.js'],
      beforeDashboard: ['./components/BeforeOrAfterDashboard.js'],
      views: {
        dashboard: {
          Component: {
            path: './components/Revenue.js#Revenue',
          },
        },
      },
    },
    dashboard: {
      defaults: [
        {
          Component: '/components/Revenue.js#Revenue',
          slug: 'revenue',
        },
      ],
    },
  },
  collections: [
    {
      slug: 'revenue',
      admin: {
        group: 'Revenue',
      },
      fields: [],
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
  },
})
