import type { CollectionConfig } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import {
  AUTH_SESSION_TEST_ADMIN_ROUTES,
  authSessionStrategyName,
  authSessionUsersSlug,
} from './shared.js'
import {
  authenticateTestOAuthSession,
  authSessionTestEndpoints,
  exposeTestOAuthSessionExpiration,
  revokeTestOAuthSessionAfterLogout,
  rotateTestOAuthSession,
  testOAuthSessionStore,
} from './testOAuthProvider.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const authSessionUsers: CollectionConfig = {
  slug: authSessionUsersSlug,
  admin: {
    useAsTitle: 'name',
  },
  auth: {
    localStrategy: false,
    removeTokenFromResponses: true,
    strategies: [
      {
        name: authSessionStrategyName,
        authenticate: authenticateTestOAuthSession,
      },
    ],
    useSessions: false,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
  hooks: {
    afterLogout: [revokeTestOAuthSessionAfterLogout],
    me: [exposeTestOAuthSessionExpiration],
    refresh: [rotateTestOAuthSession],
  },
}

export default buildConfigWithDefaults(
  {
    admin: {
      autoRefresh: false,
      components: {
        beforeLogin: ['./TestOAuthLogin/index.js#TestOAuthLogin'],
        providers: ['@payloadcms/ui#AuthSessionDebug'],
      },
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

      testOAuthSessionStore.resetToRealTime()
    },
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  { disableAutoLogin: true },
)
