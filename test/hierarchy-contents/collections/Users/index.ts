import type { CollectionConfig } from 'payload'

import { usersSlug } from '../../shared.js'

export const Users: CollectionConfig = {
  slug: usersSlug,
  access: { admin: ({ req }) => !req.context.denyAdmin, read: ({ req }) => Boolean(req.user) },
  auth: true,
  fields: [
    { name: 'name', type: 'text' },
    { name: 'secret', type: 'text', access: { read: () => false } },
  ],
}
