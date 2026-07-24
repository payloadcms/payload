import type { CollectionConfig } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import {
  authenticateProviderSession,
  authSessionTestEndpoints,
  exposeProviderSessionExpiration,
  providerSessionStore,
  revokeProviderSessionAfterLogout,
  rotateProviderSession,
} from './authFixture.js'
import {
  AUTH_SESSION_TEST_ADMIN_ROUTES,
  authSessionAPIRoute,
  authSessionStrategyName,
  authSessionTokenLifetimeMs,
  authSessionUsersSlug,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const authSessionUsers: CollectionConfig = {
  slug: authSessionUsersSlug,
  admin: {
    useAsTitle: 'name',
  },
  auth: {
    disableLocalStrategy: true,
    removeTokenFromResponses: true,
    strategies: [
      {
        authenticate: authenticateProviderSession,
        name: authSessionStrategyName,
      },
    ],
    tokenExpiration: authSessionTokenLifetimeMs / 1000,
    useSessions: false,
  },
  fields: [
    {
      name: 'name',
      required: true,
      type: 'text',
    },
    {
      name: 'sessionDebug',
      type: 'ui',
      admin: {
        components: {
          Field: './SessionDebug/index.js#SessionDebug',
        },
      },
    },
  ],
  hooks: {
    afterLogout: [revokeProviderSessionAfterLogout],
    me: [exposeProviderSessionExpiration],
    refresh: [rotateProviderSession],
  },
}

export default buildConfigWithDefaults(
  {
    admin: {
      autoRefresh: false,
      importMap: {
        baseDir: path.resolve(dirname),
      },
      routes: AUTH_SESSION_TEST_ADMIN_ROUTES,
      user: authSessionUsersSlug,
    },
    collections: [authSessionUsers],
    endpoints: authSessionTestEndpoints,
    onInit: async (payload) => {
      const existingUsers = await payload.find({
        collection: authSessionUsersSlug,
        limit: 1,
      })

      if (existingUsers.docs.length === 0) {
        await payload.create({
          collection: authSessionUsersSlug,
          data: {
            name: 'Session Test User',
          },
        })
      }

      providerSessionStore.reset({ nextNowMs: Date.now() })
    },
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    routes: {
      api: authSessionAPIRoute,
    },
  },
  { disableAutoLogin: true },
)
