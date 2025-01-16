import type { CollectionConfig } from 'payload'

import { ensureUniqueSlug } from './hooks/ensureUniqueSlug'
import { superAdminOrTeanantAdminAccess } from '@/collections/Pages/access/superAdminOrTenantAdmin'

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    create: superAdminOrTeanantAdminAccess,
    delete: superAdminOrTeanantAdminAccess,
    read: () => true,
    update: superAdminOrTeanantAdminAccess,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'slug',
      type: 'text',
      defaultValue: 'home',
      hooks: {
        beforeValidate: [ensureUniqueSlug],
      },
      index: true,
    },
  ],
}
