import type { CollectionConfig } from 'payload'

import { tenantsSlug } from '../shared.js'

export const Tenants: CollectionConfig = {
  slug: tenantsSlug,
  labels: {
    singular: 'Tenant',
    plural: 'Tenants',
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
    },
    {
      name: 'domain',
      type: 'text',
      required: true,
    },
  ],
}
