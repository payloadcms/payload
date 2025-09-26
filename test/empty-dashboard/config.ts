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
      emptyDashboard: ['/components/EmptyDashboard/index.js#EmptyDashboard'],
    },
    autoLogin: {
      email: devUser.email,
      password: devUser.password,
    },
  },
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [],
      admin: {
        group: false,
      },
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
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
