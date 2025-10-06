import type { CollectionConfig } from 'payload'

export const Relationships: CollectionConfig = {
  slug: 'relationships',
  admin: {
    useAsTitle: 'title',
    group: 'Tenant Collections',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'relationship',
      type: 'relationship',
      relationTo: 'relationships',
    },
  ],
}
