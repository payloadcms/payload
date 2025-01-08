import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Posts } from './collections/Posts.js'
import { Tenants } from './collections/Tenants.js'
import { Users } from './collections/Users.js'
import { NavigationGlobalCollection } from './globals/Navigation.js'

export default buildConfigWithDefaults({
  collections: [Users, Tenants, Posts, NavigationGlobalCollection],
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
  plugins: [
    multiTenantPlugin({
      userHasAccessToAllTenants: (user) => user.roles?.includes('admin'),
      userTenantsField: {
        access: {},
        defaultRole: 'user',
        roles: ['admin', 'user'],
      },
      documentTenantField: {
        access: {},
      },
      collections: {
        posts: {},
        'navigation-global': {
          isGlobal: true,
        },
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
