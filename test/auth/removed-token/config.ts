import type { CollectionRefreshHook } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'

export const collectionSlug = 'users'
export const providerCookie = 'provider-access-token=refreshed; HttpOnly; Path=/'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const refreshWithProviderCookie: CollectionRefreshHook = ({ args, user }) => {
  args.req.responseHeaders ??= new Headers()
  args.req.responseHeaders.append('Set-Cookie', providerCookie)

  return {
    exp: Math.floor(Date.now() / 1000) + 60,
    refreshedToken: 'provider-access-token',
    user,
  }
}

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: 'users',
  },
  collections: [
    {
      slug: collectionSlug,
      auth: {
        removeTokenFromResponses: true,
      },
      fields: [
        {
          name: 'roles',
          type: 'select',
          defaultValue: ['user'],
          hasMany: true,
          label: 'Role',
          options: ['admin', 'editor', 'moderator', 'user', 'viewer'],
          required: true,
          saveToJWT: true,
        },
      ],
      hooks: {
        refresh: [refreshWithProviderCookie],
      },
      versions: false,
    },
  ],
  debug: true,
})
