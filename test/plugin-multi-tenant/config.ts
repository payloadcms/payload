import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import type { Config as ConfigType } from './payload-types.js'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser, regularUser } from '../credentials.js'
import { LinksCollection } from './collections/Links.js'
import { Posts } from './collections/Posts.js'
import { Tenants } from './collections/Tenants.js'
import { Users } from './collections/Users.js'
import { NavigationGlobalCollection } from './globals/Navigation.js'

export default buildConfigWithDefaults({
  collections: [Users, Tenants, Posts, LinksCollection, NavigationGlobalCollection],
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
        roles: ['admin'],
      },
    })

    const tenant1 = await payload.create({
      collection: 'tenants',
      data: {
        name: 'Blue Dog',
        slug: 'blue-dog',
        domain: 'bluedog.com',
      },
    })

    await payload.create({
      collection: 'tenants',
      data: {
        name: 'Steel Cat',
        slug: 'steel-cat',
        domain: 'steelcat.com',
      },
    })

    await payload.create({
      collection: 'users',
      data: {
        email: regularUser.email,
        password: regularUser.password,
        roles: ['user'],
        tenants: [
          {
            tenant: tenant1.id,
          },
        ],
      },
    })
  },
  plugins: [
    multiTenantPlugin<ConfigType>({
      userHasAccessToAllTenants: (user) => user.roles?.includes('admin'),
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
