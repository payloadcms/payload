import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Posts } from './collections/Posts.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  suite: 'admin-routing',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [Posts],
    graphQL: {
      // E2E runs against a production build; keep the playground route reachable there.
      disablePlaygroundInProduction: false,
    },
  },
  seed: async (payload) => {
    const { totalDocs } = await payload.count({
      collection: 'users',
      overrideAccess: true,
    })

    if (totalDocs > 0) {
      return
    }

    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
      overrideAccess: true,
    })
  },
})
