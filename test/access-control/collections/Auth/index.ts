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
        update: () => false,
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
        update: () => false,
      },
    },
  ],
}
