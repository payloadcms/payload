import type { BeforeLoginHook, CollectionConfig, Payload } from 'payload'

import { AuthenticationError } from 'payload'

import { devUser, regularUser } from '../../../credentials.js'
import { afterLoginHook } from './afterLoginHook.js'
import { meHook } from './meHook.js'
import { refreshHook } from './refreshHook.js'

const beforeLoginHook: BeforeLoginHook = ({ req, user }) => {
  const isAdmin = user.roles.includes('admin') ? user : undefined
  if (!isAdmin) {
    throw new AuthenticationError(req.t)
  }
  return user
}

export const seedHooksUsers = async (payload: Payload) => {
  await payload.create({
    collection: hooksUsersSlug,
    data: devUser,
    overrideAccess: true,
  })
  await payload.create({
    collection: hooksUsersSlug,
    data: regularUser,
    overrideAccess: true,
  })
}

export const hooksUsersSlug = 'hooks-users'
type AuthOperation = 'forgotPassword' | 'login' | 'unlock'
const authOperationOverrideAccess: Partial<Record<AuthOperation, boolean | undefined>> = {}

export const clearAuthOperationOverrideAccess = () => {
  for (const operation of Object.keys(authOperationOverrideAccess)) {
    delete authOperationOverrideAccess[operation as AuthOperation]
  }

  return authOperationOverrideAccess
}

export const getAuthOperationOverrideAccess = ({ operation }: { operation: AuthOperation }) =>
  authOperationOverrideAccess[operation]

const Users: CollectionConfig = {
  slug: hooksUsersSlug,
  auth: true,
  access: {
    unlock: () => true,
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      defaultValue: ['user'],
      hasMany: true,
      label: 'Role',
      options: ['admin', 'user'],
      required: true,
      saveToJWT: true,
    },
    {
      name: 'afterLoginHook',
      type: 'checkbox',
    },
  ],
  hooks: {
    me: [meHook],
    refresh: [refreshHook],
    afterLogin: [afterLoginHook],
    beforeLogin: [beforeLoginHook],
    beforeOperation: [
      ({ operation, overrideAccess }) => {
        if (operation === 'forgotPassword' || operation === 'login' || operation === 'unlock') {
          authOperationOverrideAccess[operation] = overrideAccess
        }
      },
    ],
  },
  versions: false,
}

export default Users
