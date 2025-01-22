import type { CollectionConfig } from 'payload'

export const LinksCollection: CollectionConfig = {
  slug: 'links',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'url',
      type: 'text',
    },
  ],
}
