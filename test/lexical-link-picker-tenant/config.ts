import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import type { Config } from 'payload'

import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Tenants } from '../plugin-multi-tenant/collections/Tenants.js'
import { Users } from '../plugin-multi-tenant/collections/Users/index.js'
import { usersSlug } from '../plugin-multi-tenant/shared.js'
import { Pages, pagesSlug } from './collections/pages.js'
import { Posts, postsSlug } from './collections/posts.js'

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Tenants, Users, Pages, Posts],
  plugins: [
    multiTenantPlugin({
      userHasAccessToAllTenants: (user) => Boolean(user.roles?.includes('admin')),
      tenantField: {
        access: {},
      },
      collections: {
        [pagesSlug]: {},
        [postsSlug]: {},
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  onInit: async (payload) => {
    // IMPORTANT: This should only seed, not clear the database.
    await payload.create({
      collection: usersSlug,
      data: {
        email: devUser.email,
        password: devUser.password,
        roles: devUser.roles as ('admin' | 'user')[],
      },
    })
  },
})
