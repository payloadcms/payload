import type { CollectionConfig } from 'payload'

import { authSlug, usersSlug } from '../../shared.js'

export const Auth: CollectionConfig = {
  slug: authSlug,
  access: {
    create: () => true,
    read: () => true,
    update: ({ id, req: { user } }) =>
      user?.collection === usersSlug || (user?.collection === authSlug && user?.id === id),
  },
  auth: {
    verify: true,
    // loginWithUsername: {
    //   requireEmail: true,
    //   allowEmailLogin: true,
    // },
  },
  disableDuplicate: false,
  fields: [
    {
      name: 'email',
      type: 'text',
      access: {
        update: ({ data, req: { user } }) => {
          const isUserOrSelf =
            (user && 'roles' in user && user?.roles?.includes('admin')) ||
            (user?.id === data?.id && user?.collection === 'auth-collection')
          return isUserOrSelf
        },
      },
    },
    // {
    //   name: 'username',
    //   type: 'text',
    //   access: {
    //     update: () => false,
    //   },
    // },
    {
      name: 'password',
      type: 'text',
      access: {
        update: ({ id, req: { user } }) => {
          const isUserOrSelf =
            (user && 'roles' in user && user?.roles?.includes('admin')) ||
            (user?.collection === authSlug && user?.id === id)
          return isUserOrSelf
        },
      },
      hidden: true,
    },
    {
      name: 'roles',
      type: 'select',
      access: {
        create: ({ req }) =>
          Boolean(req.user?.collection === 'users' && req.user.roles?.includes('admin')),
        read: ({ req }) =>
          Boolean(req.user?.collection === 'users' && req.user.roles?.includes('admin')),
        update: ({ req }) =>
          Boolean(req.user?.collection === 'users' && req.user.roles?.includes('admin')),
      },
      defaultValue: ['user'],
      hasMany: true,
      options: ['admin', 'user'],
    },
  ],
  versions: false,
}
