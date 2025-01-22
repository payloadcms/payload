import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import type { Config as ConfigType } from './payload-types.js'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { LinksCollection } from './collections/Links.js'
import { Posts } from './collections/Posts.js'
import { Tenants } from './collections/Tenants.js'
import { Users } from './collections/Users.js'
import { NavigationGlobalCollection } from './globals/Navigation.js'
import { seed } from './seed/index.js'

export default buildConfigWithDefaults({
  collections: [Users, Tenants, Posts, LinksCollection, NavigationGlobalCollection],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      graphics: {
        Logo: '/components/Logo/index.js#Logo',
        Icon: '/components/Icon/index.js#Icon',
      },
    },
  },
  onInit: seed,
  plugins: [
    multiTenantPlugin<ConfigType>({
      userHasAccessToAllTenants: (user) => Boolean(user.roles?.includes('admin')),
      tenantsArrayField: {
        rowFields: [
          {
            name: 'roles',
            type: 'select',
            options: [
              { label: 'Admin', value: 'admin' },
              { label: 'User', value: 'user' },
            ],
          },
        ],
      },
      tenantField: {
        access: {},
      },
      collections: {
        posts: {},
        links: {},
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
