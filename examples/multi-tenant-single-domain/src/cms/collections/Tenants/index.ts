import type { CollectionConfig } from 'payload'
import { isSuperAdmin } from '../../access/isSuperAdmin'
import { tenantRead } from './access/read'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    create: isSuperAdmin,
    read: tenantRead,
    update: isSuperAdmin,
    delete: isSuperAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      admin: {
        description: 'Used for url paths, example: /tenant-slug/page-slug',
      },
      type: 'text',
      required: true,
      index: true,
    },
    {
      admin: {
        position: 'sidebar',
        description: 'If checked, logging in is not required.',
      },
      name: 'public',
      type: 'checkbox',
      defaultValue: false,
      index: true,
    },
  ],
}
