import type { CollectionConfig } from 'payload'

import { adminUsersSlug, restrictedAPIKeysSlug } from '../shared.js'

export const RestrictedAPIKeys: CollectionConfig = {
  slug: restrictedAPIKeysSlug,
  access: {
    update: ({ req }) =>
      req.user?.collection === adminUsersSlug && req.user.canUpdateAPIKeys === true,
  },
  auth: {
    disableLocalStrategy: true,
    useAPIKey: true,
  },
  fields: [
    {
      name: 'apiKey',
      type: 'text',
      access: {
        create: ({ req }) =>
          req.user?.collection === adminUsersSlug && req.user.canManageAPIKeys === true,
        update: ({ req }) =>
          req.user?.collection === adminUsersSlug && req.user.canManageAPIKeys === true,
      },
    },
  ],
}
