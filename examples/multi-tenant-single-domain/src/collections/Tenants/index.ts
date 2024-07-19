import type { CollectionConfig } from 'payload'

import { isSuperAdmin } from '../../access/isSuperAdmin'
import { canMutateTenant, filterByTenantRead } from './access/byTenant'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  access: {
    create: isSuperAdmin,
    delete: canMutateTenant,
    read: filterByTenantRead,
    update: canMutateTenant,
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        description: 'Used for url paths, example: /tenant-slug/page-slug',
      },
      index: true,
      required: true,
    },
    {
      name: 'public',
      type: 'checkbox',
      admin: {
        description: 'If checked, logging in is not required.',
        position: 'sidebar',
      },
      defaultValue: false,
      index: true,
    },
  ],
}
