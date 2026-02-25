import type { CollectionConfig } from 'payload'

import { authSlug } from '../../shared.js'

export const Auth: CollectionConfig = {
  slug: authSlug,
  auth: {
    verify: true,
    // loginWithUsername: {
    //   requireEmail: true,
    //   allowEmailLogin: true,
    // },
  },
  fields: [
    {
      name: 'email',
      type: 'text',
      access: {
        update: ({ req: { user }, data }) => {
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
      hidden: true,
      access: {
        update: ({ req: { user }, data }) => {
          const isUserOrSelf =
            (user && 'roles' in user && user?.roles?.includes('admin')) || user?.id === data?.id
          return isUserOrSelf
        },
      },
    },
    {
      name: 'roles',
      type: 'select',
      defaultValue: ['user'],
      hasMany: true,
      options: ['admin', 'user'],
    },
  ],
}
