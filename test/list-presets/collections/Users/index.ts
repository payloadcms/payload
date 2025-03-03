import type { CollectionConfig } from 'payload'

import { roles } from '../../fields/roles.js'
import { usersSlug } from '../../slugs.js'

export const Users: CollectionConfig = {
  slug: usersSlug,
  admin: {
    useAsTitle: 'name',
    disableListPresets: true,
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    roles,
  ],
}
