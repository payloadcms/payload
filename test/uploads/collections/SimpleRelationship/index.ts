import type { CollectionConfig } from 'payload'

export const SimpleRelationshipCollection: CollectionConfig = {
  slug: 'simple-relationship',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'text',
      name: 'title',
    },
  ],
}
