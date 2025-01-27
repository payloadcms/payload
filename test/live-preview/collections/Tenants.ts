import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { tenantsSlug } from '../shared'

export const Tenants: CollectionConfig = {
  slug: tenantsSlug,
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['id', 'clientURL'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'clientURL',
      label: 'Client URL',
      type: 'text',
      required: true,
    },
  ],
}
