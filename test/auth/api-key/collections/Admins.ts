import type { CollectionConfig } from 'payload'

import { adminUsersSlug } from '../shared.js'

export const Admins: CollectionConfig = {
  slug: adminUsersSlug,
  auth: {
    useAPIKey: true,
  },
  fields: [
    {
      name: 'canManageAPIKeys',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'canUpdateAPIKeys',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
