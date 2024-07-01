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
  })
  await payload.create({
    collection: hooksUsersSlug,
    data: regularUser,
  })
}

export const hooksUsersSlug = 'hooks-users'
const Users: CollectionConfig = {
  slug: hooksUsersSlug,
  auth: true,
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
  },
}

export default Users
